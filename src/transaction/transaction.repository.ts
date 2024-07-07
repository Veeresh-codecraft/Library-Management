import date from "date-and-time";
import { readLine } from "../../core/input.utils";
import { IPageRequest, IPagedResponse } from "../../core/pagination.model";
import { IRepository } from "../../core/repository";
import { Database } from "../../db/db";
import { ITransaction, ITransactionBase } from "./model/transaction.model";

export class TransactionRepository
  implements IRepository<ITransactionBase, ITransaction>
{
  private readonly transactions: ITransaction[];

  constructor(private readonly db: Database<{ transactions: ITransaction[] }>) {
    this.transactions = this.db.table("transactions");
  }
  async create(data: ITransactionBase): Promise<ITransaction> {
    // TODO dont send array just send last transaction id
    const LastTransactionId = getLastTransactionId(this.transactions);
    const transaction = await constructTransaction(data, LastTransactionId);
    this.transactions.push(transaction);
    await this.db.save();
    return transaction;
  }
  async Returnupdate(
    transaction: ITransactionBase
  ): Promise<ITransaction | null> {
    const [transactionId, status, lateFees] = await generateStatusAndLateFees(
      transaction.transactionType
    );
    const curtransactionNum = this.transactions.findIndex(
      (t) => t.transactionId === transactionId
    );

    if (curtransactionNum !== -1) {
      const curtransaction = this.transactions[curtransactionNum];

      if (status !== undefined) {
        curtransaction.status = status;
      }
      curtransaction.transactionType = "return";
      curtransaction.lateFees = lateFees;
      this.transactions[curtransactionNum] = curtransaction;
      await this.db.save();
      return curtransaction;
    }

    return null;
  }

  async update(
    id: number,
    data: ITransactionBase
  ): Promise<ITransaction | null> {
    const index = this.transactions.findIndex((t) => t.transactionId === id);
    if (index === -1) {
      return null;
    }
    const updatedTransaction: ITransaction = {
      ...this.transactions[index],
      ...data,
    };
    this.transactions[index] = updatedTransaction;
    await this.db.save();
    return updatedTransaction;
  }

  async delete(id: number): Promise<ITransaction | null> {
    const index = this.transactions.findIndex((t) => t.transactionId === id);
    if (index === -1) {
      return null;
    }
    const deletedTransaction = this.transactions.splice(index, 1)[0];
    await this.db.save();
    return deletedTransaction;
  }

  getById(id: number): ITransaction | null {
    const transaction = this.transactions.find((t) => t.transactionId === id);
    return transaction || null;
  }

  list(params: IPageRequest): IPagedResponse<ITransaction> {
    {
      const search = params.search?.toLocaleLowerCase();
  
  let filteredTransactions = this.transactions;

      if (search) {
        const type = search.charAt(0);
        const id = +search.substring(1); // Convert the ID part to a number

        filteredTransactions = this.transactions.filter((t) => {
          if (type === 'u') {
            return t.userId === id;
          } else if (type === 'b') {
            return t.bookId === id;
          }
          return false;
        });
      }
      const items = filteredTransactions.slice(
        params.offset,
        params.limit + params.offset
      );
      const hasNext =
        params.offset + params.limit < filteredTransactions.length;
      const hasPrevious = params.offset > 0;

      return {
        items,
        pagination: {
          offset: params.offset,
          limit: params.limit,
          total: filteredTransactions.length,
          hasNext,
          hasPrevious,
        },
      };
    }
  }
}
async function constructTransaction(
  data: ITransactionBase,
  LastTransactionId: number
): Promise<ITransaction> {
  const transaction: ITransactionBase = { ...data };
  const transactionId = LastTransactionId + 1;
  const transactionDate = generateTransactionDate();
  const dueDate = generateDueDate(transactionDate, transaction.transactionType);
  const returnDate = generateReturnDate(transaction.transactionType);
  const [trans, status, lateFees] = await generateStatusAndLateFees(
    transaction.transactionType
  );
  return {
    ...data,
    transactionId: transactionId,
    status: status,
    transactionDate: transactionDate,
    dueDate: dueDate,
    returnDate: returnDate,
    lateFees: lateFees,
  };
}

function getLastTransactionId(transactions: ITransaction[]): number {
  if (transactions.length === 0) {
    return 0;
  }
  return transactions[transactions.length - 1].transactionId;
}

function generateTransactionDate() {
  const today = new Date();
  return today;
}

function generateDueDate(
  transactionDate: Date,
  transactionType: string
): Date | undefined {
  if (transactionType === "borrow") {
    const currMonth = transactionDate.getMonth();
    const dueMonth = new Date();
    dueMonth.setMonth(currMonth + 1);
    return dueMonth;
  } else {
    return undefined; // Set return date to undefined if the transaction type is not "borrow"
  }
}

function generateReturnDate(transactionType: string): Date | undefined {
  if (transactionType === "return") {
    return undefined;
  } else {
    const today = new Date();
    return today;
  }
}

async function generateStatusAndLateFees(
  transactionType: "borrow" | "return"
): Promise<
  | [undefined, "pending", undefined]
  | [number, "completed", undefined]
  | [number, "overdue", number]
> {
  // Late fees declaration
  const lateFees = 5;
  if (transactionType === "borrow") {
    return [undefined, "pending", undefined];
  } else {
    const transactionId = +(await readLine(`Please enter transaction ID:`));
    const repo = new TransactionRepository(
      new Database("../Library-Management/data/databse.json")
    );
    const transaction = repo.getById(transactionId);
    const dueDate = transaction?.dueDate;
    const today = new Date();
    // added below if bcz type-script was throwing error
    if (!dueDate) {
      throw new Error("Due date is undefined");
    } else {
      if (today <= dueDate) {
        return [transaction.transactionId, "completed", undefined];
      } else {
        const dueDay = date.subtract(today, dueDate).toDays();
        const netLateFees = dueDay * lateFees;
        return [transaction.transactionId, "overdue", netLateFees];
      }
    }
  }
}
