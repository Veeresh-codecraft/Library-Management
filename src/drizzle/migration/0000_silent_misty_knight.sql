CREATE TABLE `books` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`author` varchar(255) NOT NULL,
	`publisher` varchar(255),
	`genre` varchar(100),
	`isbnNo` varchar(20),
	`numofPages` int NOT NULL,
	`totalNumberOfCopies` int NOT NULL,
	`availableNumberOfCopies` int NOT NULL,
	CONSTRAINT `books_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trainee` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	CONSTRAINT `trainee_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`transactionId` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookId` int NOT NULL,
	`issueddate` timestamp NOT NULL DEFAULT (now()),
	`returnDate` varchar(100) NOT NULL,
	`isReturned` tinyint NOT NULL DEFAULT 0,
	`fine` int NOT NULL DEFAULT 0,
	CONSTRAINT `transactions_transactionId` PRIMARY KEY(`transactionId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`userId` int AUTO_INCREMENT NOT NULL,
	`username` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`role` varchar(255) NOT NULL,
	CONSTRAINT `users_userId` PRIMARY KEY(`userId`)
);
