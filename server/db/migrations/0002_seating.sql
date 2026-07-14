CREATE TABLE `tables` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`shape` text DEFAULT 'round' NOT NULL,
	`x` real DEFAULT 0 NOT NULL,
	`y` real DEFAULT 0 NOT NULL,
	`capacity` integer DEFAULT 8 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);--> statement-breakpoint
ALTER TABLE `guests` ADD `table_id` integer REFERENCES tables(id);--> statement-breakpoint
ALTER TABLE `guests` ADD `seat_index` integer;
