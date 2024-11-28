declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GROQ_API_KEY: string
      // ... other env variables
    }
  }
}

export {} 