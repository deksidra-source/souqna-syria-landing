CREATE TABLE `content_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`reportedUserId` int NOT NULL,
	`listingId` int,
	`messageId` int,
	`reason` enum('fraud','spam','harassment','illegal','inappropriate','other') NOT NULL,
	`details` varchar(800),
	`status` enum('open','reviewing','resolved','dismissed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`resolvedBy` int,
	CONSTRAINT `content_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `data_deletion_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`details` varchar(500),
	`status` enum('open','reviewing','completed','rejected') NOT NULL DEFAULT 'open',
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	`processedBy` int,
	CONSTRAINT `data_deletion_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_blocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blockerId` int NOT NULL,
	`blockedId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_blocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_blocks_blocker_blocked_unique` UNIQUE(`blockerId`,`blockedId`)
);
--> statement-breakpoint
CREATE TABLE `user_policy_acceptances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`policyVersion` varchar(32) NOT NULL,
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_policy_acceptances_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_policy_acceptances_unique` UNIQUE(`userId`,`policyVersion`)
);
--> statement-breakpoint
ALTER TABLE `content_reports` ADD CONSTRAINT `content_reports_reporterId_users_id_fk` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_reports` ADD CONSTRAINT `content_reports_reportedUserId_users_id_fk` FOREIGN KEY (`reportedUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_reports` ADD CONSTRAINT `content_reports_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_reports` ADD CONSTRAINT `content_reports_messageId_conversation_messages_id_fk` FOREIGN KEY (`messageId`) REFERENCES `conversation_messages`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_reports` ADD CONSTRAINT `content_reports_resolvedBy_users_id_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_deletion_requests` ADD CONSTRAINT `data_deletion_requests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `data_deletion_requests` ADD CONSTRAINT `data_deletion_requests_processedBy_users_id_fk` FOREIGN KEY (`processedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_blocks` ADD CONSTRAINT `user_blocks_blockerId_users_id_fk` FOREIGN KEY (`blockerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_blocks` ADD CONSTRAINT `user_blocks_blockedId_users_id_fk` FOREIGN KEY (`blockedId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_policy_acceptances` ADD CONSTRAINT `user_policy_acceptances_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `content_reports_status_created_idx` ON `content_reports` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `content_reports_reported_user_idx` ON `content_reports` (`reportedUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `data_deletion_requests_status_requested_idx` ON `data_deletion_requests` (`status`,`requestedAt`);--> statement-breakpoint
CREATE INDEX `user_blocks_blocked_idx` ON `user_blocks` (`blockedId`);