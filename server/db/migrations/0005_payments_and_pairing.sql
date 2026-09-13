CREATE TABLE `payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`party_id` integer NOT NULL REFERENCES parties(id),
	`transaction_id` text,
	`amount` real NOT NULL,
	`matched_on` text NOT NULL,
	`seen_at` text NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_transaction_id_unique` ON `payments` (`transaction_id`);--> statement-breakpoint
ALTER TABLE `room_requests` ADD `paired_with_id` integer;--> statement-breakpoint
INSERT INTO `payments` (`party_id`, `amount`, `matched_on`, `seen_at`)
	SELECT `id`, `amount_paid`, 'manual', strftime('%Y-%m-%dT%H:%M:%fZ', 'now') FROM `parties` WHERE `amount_paid` != 0;--> statement-breakpoint
ALTER TABLE `parties` DROP COLUMN `amount_paid`;
