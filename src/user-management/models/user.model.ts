export interface IUserBase {
  username: string;
  email: string;
  passwordHash: string;
  role: string;
}

export interface IUser extends IUserBase {
  userId: number;
}
