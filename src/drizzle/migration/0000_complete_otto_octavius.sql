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
CREATE TABLE `refresh_tokens` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` text NOT NULL,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`transactionId` serial AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookId` int NOT NULL,
	`issuedDate` timestamp NOT NULL DEFAULT (now()),
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
	`password` varchar(255) NOT NULL,
	`role` varchar(255) NOT NULL,
	CONSTRAINT `users_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_users_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_userId_users_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_bookId_books_id_fk` FOREIGN KEY (`bookId`) REFERENCES `books`(`id`) ON DELETE no action ON UPDATE no action;