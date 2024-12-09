import { Groq } from 'groq-sdk';

class ApiKeyRotation {
  private static keys: string[] = [];
  private static currentIndex: number = 0;
  private static lastUsedTime: { [key: string]: number } = {};
  private static retryDelayMs: number = 5000; // 5 seconds delay before retrying a failed key
  private static isInitialized: boolean = false;

  static initialize() {
    if (this.isInitialized) return;

    const apiKeys = process.env.GROQ_API_KEYS;
    if (!apiKeys) {
      // Fallback to single key for backward compatibility
      if (process.env.GROQ_API_KEY) {
        this.keys = [process.env.GROQ_API_KEY];
      } else {
        throw new Error('No GROQ API keys configured');
      }
    } else {
      this.keys = apiKeys.split(',').map(key => key.trim()).filter(key => key.length > 0);
    }

    if (this.keys.length === 0) {
      throw new Error('No valid API keys configured');
    }

    this.isInitialized = true;
  }

  static getNextClient(): Groq {
    try {
      if (!this.isInitialized) {
        this.initialize();
      }

      const startIndex = this.currentIndex;
      let attempts = 0;

      while (attempts < this.keys.length) {
        const key = this.keys[this.currentIndex];
        const lastUsed = this.lastUsedTime[key] || 0;
        const now = Date.now();

        // If the key was used recently and failed, skip it
        if (now - lastUsed > this.retryDelayMs) {
          // Update the index for the next call
          this.currentIndex = (this.currentIndex + 1) % this.keys.length;
          
          return new Groq({
            apiKey: key,
          });
        }

        // Move to the next key
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;
        attempts++;
      }

      // If all keys are in cooldown, use the first available one anyway
      this.currentIndex = (startIndex + 1) % this.keys.length;
      return new Groq({
        apiKey: this.keys[startIndex],
      });
    } catch (error) {
      // Fallback to first key if something goes wrong
      return new Groq({
        apiKey: this.keys[0],
      });
    }
  }

  static markKeyAsFailed(apiKey: string) {
    this.lastUsedTime[apiKey] = Date.now();
  }
}

export default ApiKeyRotation;
