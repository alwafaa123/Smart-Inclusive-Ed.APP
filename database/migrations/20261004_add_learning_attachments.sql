USE `smart_inclusive_ed`;

ALTER TABLE `modules`
  ADD COLUMN `attachment_path` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN `attachment_name` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN `attachment_type` VARCHAR(100) DEFAULT NULL;

ALTER TABLE `assignments`
  ADD COLUMN `attachment_path` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN `attachment_name` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN `attachment_type` VARCHAR(100) DEFAULT NULL;

ALTER TABLE `submissions`
  ADD COLUMN `attachment_path` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN `attachment_name` VARCHAR(255) DEFAULT NULL,
  ADD COLUMN `attachment_type` VARCHAR(100) DEFAULT NULL;
