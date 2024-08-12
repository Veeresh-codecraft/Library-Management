import "dotenv/config";
export interface AppEnv {
  DATABASE_URL: string;
}

export const AppEnvs = process.env as unknown as AppEnv;
