ALTER TABLE `guests` ADD `starter_choice_id` text;--> statement-breakpoint
ALTER TABLE `guests` ADD `main_choice_id` text;--> statement-breakpoint
ALTER TABLE `guests` ADD `dessert_choice_id` text;--> statement-breakpoint
UPDATE `guests` SET `main_choice_id` = `meal_choice_id`;--> statement-breakpoint
ALTER TABLE `guests` DROP COLUMN `meal_choice_id`;
