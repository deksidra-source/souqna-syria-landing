CREATE TABLE `support_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(120) NOT NULL,
	`email` varchar(320) NOT NULL,
	`subject` varchar(160) NOT NULL,
	`message` text NOT NULL,
	`status` enum('open','reviewing','resolved') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `support_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `support_requests` ADD CONSTRAINT `support_requests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `support_requests_status_created_idx` ON `support_requests` (`status`,`createdAt`);