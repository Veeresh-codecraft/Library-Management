ALTER TABLE `users` ADD `password` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `passwordHash`;