declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GROQ_API_KEY: string;
      NEXT_PUBLIC_APP_URL: string;
    }
  }
}

export {} 