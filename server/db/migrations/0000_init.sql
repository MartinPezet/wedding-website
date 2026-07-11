CREATE TABLE `guests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`party_id` integer NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_child` integer DEFAULT false NOT NULL,
	`phone` text,
	`attending` integer,
	`meal_choice_id` text,
	`dietary_notes` text,
	FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `parties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`token` text NOT NULL,
	`song_request` text,
	`note_to_couple` text,
	`responded_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parties_token_unique` ON `parties` (`token`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
