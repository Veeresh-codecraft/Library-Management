import "dotenv/config";
export interface AppEnv {
  JWT_SECRET(
    token: string,
    JWT_SECRET: any,
    arg2: (
      err: any,
      user: any
    ) => import("express").Response<any, Record<string, any>> | undefined
  ): unknown;
  DATABASE_URL: string;
}

export const AppEnvs = process.env as unknown as AppEnv;
