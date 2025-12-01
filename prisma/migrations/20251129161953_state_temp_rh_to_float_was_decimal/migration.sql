/*
  Warnings:

  - You are about to alter the column `current_temp_c` on the `state` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to alter the column `current_rh_percent` on the `state` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "state" ALTER COLUMN "current_temp_c" DROP NOT NULL,
ALTER COLUMN "current_temp_c" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "current_rh_percent" DROP NOT NULL,
ALTER COLUMN "current_rh_percent" SET DATA TYPE DOUBLE PRECISION;
