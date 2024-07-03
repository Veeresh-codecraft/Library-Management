import { log } from "console";
import { readChar, readLine } from "../../core/input.utils";
import { IInteractor } from "../../core/interactor";
// import { IBookBase } from "../models/books.model";
import { IUserBase, IUser } from "./models/user.model";
import { UserRepository } from "./user.repository";
const menu = `
    1. Add User
    2. Update User
    3. Search User
    4. list user
    5. dlt User
    6. Exit
    `;

export class UserInteractor implements IInteractor {
  private repo = new UserRepository();
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
        const UIdToSearch = +(await readLine("Enter User Id to delete"));
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
  previous: IUser = { name: "", DOB: "", phoneNum: 0, UId: 0 }
): Promise<IUserBase> {
  const name = await readLine(`Please enter the Name ${previous?.name}:`);
  const DOB = await readLine(
    `Please enter the Date Of birth ${previous?.DOB}:`
  );
  const phoneNum = await readLine(
    `Please enter the Phone Number ${previous?.phoneNum}:`
  );

  return {
    name: name,
    // UId: +UId,
    DOB: DOB,
    phoneNum: +phoneNum,
  };
}

async function addUser(repo: UserRepository) {
  const user: IUserBase = await getUserInput();
  const createUser = repo.create(user);
  // console.table(user);
}

async function updateUser(repo: UserRepository, UIdToUpdate: number) {
  const user: IUser = repo.getById(UIdToUpdate)!;
  const updatedData = await getUserInput(user!);
  if (updatedData?.name != "") user.name = updatedData.name;
  if (updatedData.DOB != "") user.DOB = updatedData.DOB;
  if (updatedData.phoneNum != 0) user.phoneNum = updatedData.phoneNum;
}

const a: UserInteractor = new UserInteractor();
a.showMenu();
