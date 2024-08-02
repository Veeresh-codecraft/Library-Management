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
