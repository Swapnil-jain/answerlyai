declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // API
      DEEPINFRA_KEY: string;

      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;

      // Widget
      NEXT_PUBLIC_APP_URL: string;
      NEXT_PUBLIC_DEFAULT_USER_ID: string;
      NEXT_PUBLIC_WIDGET_ID: string;

      // Dodo
      DODO_SECRET_KEY: string;
      DODO_API_URL: string;
      NEXT_PUBLIC_DODO_HOBBYIST_MONTHLY: string;
      NEXT_PUBLIC_DODO_HOBBYIST_ANNUAL: string;
      NEXT_PUBLIC_DODO_GROWTH_MONTHLY: string;
      NEXT_PUBLIC_DODO_GROWTH_ANNUAL: string;
      NEXT_PUBLIC_DODO_STARTUP_MONTHLY: string;
      NEXT_PUBLIC_DODO_STARTUP_ANNUAL: string;

      // Google
      GMAIL_USER: string;
      GMAIL_APP_PASSWORD: string;
      NEXT_PUBLIC_GTAG: string;

      // Node
      NODE_ENV: string;
    }
  }
}

export {} 