export interface ITransactionBase {
  bookId: number;
  userId: number;
  transactionType: "borrow" | "return";
}

export interface ITransaction extends ITransactionBase {
  transactionDate: Date;
  dueDate?: Date;
  returnDate?: Date;
  status: "pending" | "completed" | "overdue";
  transactionId: number;
  lateFees?: number;
  // TODO: add bookLimit for each user!
}
