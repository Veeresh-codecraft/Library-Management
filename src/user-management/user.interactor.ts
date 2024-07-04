import { readChar, readLine } from "../../core/input.utils";
import { IInteractor } from "../../core/interactor";
import { IUserBase, IUser } from "./models/user.model";
import { UserRepository } from "./user.repository";
import { Database } from "../../db/db";
import { z } from "zod";
import chalk from "chalk";

const menu = `
    1. Add User
    2. Update User
    3. Search User
    4. list user
    5. dlt User
    6. Exit
    `;

const userSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .regex(/^[A-Za-z]+$/, "Name must contain only alphabets"),
  DOB: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be in YYYY-MM-DD format"),
  phoneNum: z
    .number()
    .int()
    .min(1000000000, "Phone number must be at least 10 digits"),
});

export class UserInteractor implements IInteractor {
  private repo = new UserRepository(new Database("../data/data.json"));

  async showMenu(): Promise<void> {
    const op = await readChar(menu);
    switch (op.toLowerCase()) {
      case "1":
        await addUser(this.repo);
        // TODO add book flow
        break;
      case "2":
        console.log("Update");
        const UIdToUpdate = +(await readLine(
          "Enter the User Id to update user details."
        ));
        await updateUser(this.repo, UIdToUpdate);
        break;
      case "3":
        const UIdToSearch = +(await readLine("Enter User Id to search"));
        const user = this.repo.getById(UIdToSearch);
        console.table(user);
        break;
      case "4":
        this.repo.lists();
        break;
      case "5":
        const UId = await readLine("Enter User Id to delete");
        this.repo.delete(+UId);
        break;
      case "6":
        process.exit(0);
    }
    await this.showMenu();
  }
}

async function getUserInput(
  previous: IUser = { name: "", DOB: "", phoneNum: 0, UId: -1 }
): Promise<IUserBase> {
  previous.name = await readLine(`Please enter the Name (${previous?.name}):`);
  previous.DOB = await readLine(
    `Please enter the Date Of Birth (${previous?.DOB}):`
  );
  previous.phoneNum = parseInt(
    await readLine(`Please enter the Phone Number (${previous?.phoneNum}):`)
  );

  const parsed = userSchema.safeParse(previous);

  if (!parsed.success) {
    console.log(
      chalk.red("Invalid input:"),
      parsed.error.issues.forEach((error) =>
        console.log(chalk.red(error.message))
      )
    );
    return getUserInput(previous); // Prompt again if validation fails
  }

  return parsed.data;
}

async function addUser(repo: UserRepository) {
  const user: IUserBase = await getUserInput();
  repo.create(user);
}

async function updateUser(repo: UserRepository, UIdToUpdate: number) {
  const user: IUser = repo.getById(UIdToUpdate)!;
  const updatedData = await getUserInput(user);
  if (updatedData.name) user.name = updatedData.name;
  if (updatedData.DOB) user.DOB = updatedData.DOB;
  if (updatedData.phoneNum) user.phoneNum = updatedData.phoneNum;
}

const a: UserInteractor = new UserInteractor();
a.showMenu();
