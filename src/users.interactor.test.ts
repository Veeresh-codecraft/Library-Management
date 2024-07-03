import { describe, test, expect, beforeEach, vi } from "vitest";
import { UserInteractor } from "./users.interactor";
import { UserRepository } from "./models/users.repository";
import { readChar, readLine } from "../core/input.utils";

// Mock the readChar and readLine functions
vi.mock("../core/input.utils", () => ({
  readChar: vi.fn(),
  readLine: vi.fn(),
}));

// Helper to set up UserRepository mock
function createMockUserRepo() {
  const repo = new UserRepository();
  repo.create = vi.fn(repo.create.bind(repo));
  repo.delete = vi.fn(repo.delete.bind(repo));
  repo.getById = vi.fn(repo.getById.bind(repo));
  repo.lists = vi.fn(repo.lists.bind(repo));
  return repo;
}

describe("UserInteractor", () => {
  let userInteractor: UserInteractor;
  let mockRepo: UserRepository;

  beforeEach(() => {
    mockRepo = createMockUserRepo();
    userInteractor = new UserInteractor();
    userInteractor["repo"] = mockRepo;
  });

  test("should add a user", async () => {
    // Mocking input for add user
    (readLine as vi.Mock)
      .mockResolvedValueOnce("John Doe")
      .mockResolvedValueOnce("1990-01-01")
      .mockResolvedValueOnce("1234567890");

    await userInteractor["addUserFlow"]();

    expect(mockRepo.create).toHaveBeenCalledWith({
      name: "John Doe",
      DOB: "1990-01-01",
      phoneNum: 1234567890,
    });
  });

  test("should delete a user", async () => {
    // Mocking input for delete user
    (readLine as vi.Mock).mockResolvedValueOnce("1");

    await userInteractor["deleteUserFlow"]();

    expect(mockRepo.delete).toHaveBeenCalledWith(1);
  });

  test("should list users", async () => {
    await userInteractor["showMenu"]();

    (readChar as vi.Mock).mockResolvedValueOnce("4");

    expect(mockRepo.lists).toHaveBeenCalled();
  });

  test("should search a user", async () => {
    // Mocking input for search user
    (readLine as vi.Mock).mockResolvedValueOnce("1");

    const user = {
      UId: 1,
      name: "John Doe",
      DOB: "1990-01-01",
      phoneNum: 1234567890,
    };
    (mockRepo.getById as vi.Mock).mockReturnValueOnce(user);

    await userInteractor["searchUserFlow"]();

    expect(mockRepo.getById).toHaveBeenCalledWith(1);
  });
});
