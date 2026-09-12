CREATE TABLE `listing_promotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('ecash') NOT NULL DEFAULT 'ecash',
	`status` enum('pending','active','expired','failed','cancelled') NOT NULL DEFAULT 'pending',
	`referenceAmountUsd` decimal(6,2) NOT NULL,
	`amountSyp` int NOT NULL,
	`durationDays` int NOT NULL DEFAULT 15,
	`externalPaymentId` varchar(255),
	`merchantReference` varchar(120) NOT NULL,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listing_promotions_id` PRIMARY KEY(`id`),
	CONSTRAINT `listing_promotions_merchantReference_unique` UNIQUE(`merchantReference`)
);
--> statement-breakpoint
ALTER TABLE `listing_promotions` ADD CONSTRAINT `listing_promotions_listingId_listings_id_fk` FOREIGN KEY (`listingId`) REFERENCES `listings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `listing_promotions` ADD CONSTRAINT `listing_promotions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `listing_promotions_listing_status_idx` ON `listing_promotions` (`listingId`,`status`);--> statement-breakpoint
CREATE INDEX `listing_promotions_status_ends_idx` ON `listing_promotions` (`status`,`endsAt`);--> statement-breakpoint
CREATE INDEX `listing_promotions_user_created_idx` ON `listing_promotions` (`userId`,`createdAt`);