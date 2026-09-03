CREATE TABLE `appointment_slots` (
	`appointment_date` text NOT NULL,
	`start_time` text NOT NULL,
	`appointment_id` text NOT NULL,
	PRIMARY KEY(`appointment_date`, `start_time`),
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_appointment_slots_appointment` ON `appointment_slots` (`appointment_id`);--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`service_id` text NOT NULL,
	`service_name` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`customer_name` text NOT NULL,
	`customer_email` text NOT NULL,
	`customer_phone` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`appointment_date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`starts_at` integer NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`whatsapp_consent` integer DEFAULT false NOT NULL,
	`reminder_sent_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_appointments_date_status` ON `appointments` (`appointment_date`,`status`);--> statement-breakpoint
CREATE INDEX `idx_appointments_starts_at` ON `appointments` (`starts_at`);--> statement-breakpoint
CREATE INDEX `idx_appointments_email` ON `appointments` (`customer_email`);--> statement-breakpoint
CREATE TABLE `blocked_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`blocked_date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`reason` text DEFAULT 'Unavailable' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_blocked_slots_date` ON `blocked_slots` (`blocked_date`);--> statement-breakpoint
CREATE TABLE `business_hours` (
	`day_of_week` integer PRIMARY KEY NOT NULL,
	`opens_at` text NOT NULL,
	`closes_at` text NOT NULL,
	`is_closed` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gallery_images` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`alt_text` text NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`content_type` text NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gallery_images_object_key_unique` ON `gallery_images` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_gallery_published_sort` ON `gallery_images` (`is_published`,`sort_order`,`created_at`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_name` text NOT NULL,
	`rating` integer NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_reviews_status_created` ON `reviews` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`duration_minutes` integer NOT NULL,
	`price_from_pence` integer,
	`consultation_required` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_services_active_sort` ON `services` (`active`,`sort_order`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
PRAGMA optimize;
