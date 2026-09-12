CREATE TABLE `room_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`party_id` integer NOT NULL REFERENCES parties(id),
	`night` text NOT NULL,
	`choice` text NOT NULL,
	`share_with` text,
	`occupants` integer DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);--> statement-breakpoint
ALTER TABLE `parties` ADD `amount_paid` real DEFAULT 0 NOT NULL;
