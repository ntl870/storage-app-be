export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string;
      DB_HOST: string;
      DB_PORT: string;
      DB_USER_NAME: string;
      DB_PASSWORD: string;
      DB_NAME: string;
    }
  }
}
