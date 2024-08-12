export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

// Extract enum values as a tuple
const userRoles: [UserRole.ADMIN, UserRole.USER] = [
  UserRole.ADMIN,
  UserRole.USER,
];
