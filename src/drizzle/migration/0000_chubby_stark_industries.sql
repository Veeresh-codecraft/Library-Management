CREATE TABLE `trainee` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	CONSTRAINT `trainee_id` PRIMARY KEY(`id`)
);
