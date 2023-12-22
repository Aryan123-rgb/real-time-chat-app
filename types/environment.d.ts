// types/environment.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      UPSTASH_REDIS_REST_URL: string;
      UPSTASH_REDIS_REST_TOKEN: string;
      // Add other environment variables here if needed
    }
  }
}
