CREATE TABLE `listing_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`url` varchar(700) NOT NULL,
	`altText` varchar(180),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listing_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listing_interests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('favorite','contact') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listing_interests_id` PRIMARY KEY(`id`),
	CONSTRAINT `listing_interests_unique` UNIQUE(`listingId`,`userId`,`type`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('real_estate','vehicles','jobs','used_items','services') NOT NULL,
	`status` enum('draft','published','paused','archived') NOT NULL DEFAULT 'published',
	`title` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`province` varchar(64) NOT NULL,
	`area` varchar(120),
	`price` decimal(14,2),
	`currency` enum('SYP','USD') NOT NULL DEFAULT 'SYP',
	`priceType` enum('fixed','negotiable','on_request') NOT NULL DEFAULT 'fixed',
	`contactName` varchar(120) NOT NULL,
	`contactPhone` varchar(32) NOT NULL,
	`isPhoneVisible` boolean NOT NULL DEFAULT true,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`attributes` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`publishedAt` timestamp,
	CONSTRAINT `listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`listingId` int,
	`type` enum('listing_created','listing_status_changed','new_interest') NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `listing_images` ADD CONSTRAINT `listing_images_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_interests` ADD CONSTRAINT `listing_interests_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_interests` ADD CONSTRAINT `listing_interests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listings` ADD CONSTRAINT `listings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `listing_images_listing_sort_idx` ON `listing_images` (`listingId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `listing_interests_listing_idx` ON `listing_interests` (`listingId`);--> statement-breakpoint
CREATE INDEX `listings_user_status_idx` ON `listings` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `listings_status_category_created_idx` ON `listings` (`status`,`category`,`createdAt`);--> statement-breakpoint
CREATE INDEX `listings_province_price_idx` ON `listings` (`province`,`price`);--> statement-breakpoint
CREATE INDEX `notifications_user_read_created_idx` ON `notifications` (`userId`,`isRead`,`createdAt`);