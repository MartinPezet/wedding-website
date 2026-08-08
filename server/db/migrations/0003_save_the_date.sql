CREATE TABLE `save_the_date_responses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`address_line1` text NOT NULL,
	`address_line2` text,
	`city` text NOT NULL,
	`postcode` text NOT NULL,
	`country` text NOT NULL,
	`stay_night_before` integer DEFAULT false NOT NULL,
	`stay_night_of` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX `save_the_date_responses_phone_unique` ON `save_the_date_responses` (`phone`);
