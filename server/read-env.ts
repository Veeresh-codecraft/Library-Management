import "dotenv/config";

export interface AppEnv {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
}

export const AppEnvs = process.env as unknown as AppEnv;
