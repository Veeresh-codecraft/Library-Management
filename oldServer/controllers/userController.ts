// userController.ts
import { Request, Response } from "express";
import { UserRepository } from "../repositories/userRepository"; // Adjust path as necessary
import { MySql2Database } from "drizzle-orm/mysql2";
import { DrizzleManager } from "../drizzleDbConnection";
import { User } from "../models/user.model"; // Adjust path as necessary

const drizzleManager = new DrizzleManager();
const db = drizzleManager.getPoolDrizzle();
const userRepository = new UserRepository(db);

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { limit, offset, search } = req.query;
    const users = await userRepository.list({
      limit: parseInt(limit as string) || 10,
      offset: parseInt(offset as string) || 0,
      search: search as string,
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving users" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await userRepository.getById(parseInt(id));
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;
  try {
    const newUser = await userRepository.create({
      username,
      email,
      passwordHash: password,
      role,
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: "Error creating user" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, email, password, role } = req.body;
  try {
    const updatedUser = await userRepository.update(parseInt(id), {
      username,
      email,
      passwordHash: password,
      role,
    });
    if (updatedUser) {
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating user" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const deletedUser = await userRepository.delete(parseInt(id));
    if (deletedUser) {
      res.json(deletedUser);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting user" });
  }
};
