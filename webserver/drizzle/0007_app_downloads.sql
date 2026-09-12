CREATE TABLE `app_downloads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('android','ios','web') NOT NULL,
	`appVersion` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `app_downloads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `app_downloads_platform_created_idx` ON `app_downloads` (`platform`,`createdAt`);
