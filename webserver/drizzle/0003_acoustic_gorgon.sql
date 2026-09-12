CREATE TABLE `conversation_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderId` int NOT NULL,
	`body` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversation_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listing_conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`ownerId` int NOT NULL,
	`buyerId` int NOT NULL,
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listing_conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `listing_conversations_listing_buyer_unique` UNIQUE(`listingId`,`buyerId`)
);
--> statement-breakpoint
ALTER TABLE `conversation_messages` ADD CONSTRAINT `conversation_messages_conversationId_listing_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `listing_conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `conversation_messages` ADD CONSTRAINT `conversation_messages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_conversations` ADD CONSTRAINT `listing_conversations_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_conversations` ADD CONSTRAINT `listing_conversations_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_conversations` ADD CONSTRAINT `listing_conversations_buyerId_users_id_fk` FOREIGN KEY (`buyerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `conversation_messages_conversation_created_idx` ON `conversation_messages` (`conversationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `listing_conversations_owner_last_idx` ON `listing_conversations` (`ownerId`,`lastMessageAt`);--> statement-breakpoint
CREATE INDEX `listing_conversations_buyer_last_idx` ON `listing_conversations` (`buyerId`,`lastMessageAt`);