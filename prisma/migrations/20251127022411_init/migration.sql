-- CreateEnum
CREATE TYPE "device_mode" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "incubator_status" AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "activation_result" AS ENUM ('APPLIED', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "incubator" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "incubator_status" NOT NULL DEFAULT 'OFFLINE',
    "mode" "device_mode" NOT NULL DEFAULT 'AUTO',
    "fwVersion" TEXT,
    "location_label" TEXT,
    "last_seen_at" TIMESTAMP(3),
    "last_session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incubator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baby_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "medical_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baby_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incubator_session" (
    "id" TEXT NOT NULL,
    "incubator_id" TEXT NOT NULL,
    "baby_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incubator_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_parameters" (
    "id" TEXT NOT NULL,
    "incubator_id" TEXT NOT NULL,
    "temp_on_c" DOUBLE PRECISION NOT NULL DEFAULT 36.70,
    "temp_off_c" DOUBLE PRECISION NOT NULL DEFAULT 36.30,
    "rh_on_percent" DOUBLE PRECISION NOT NULL DEFAULT 60.00,
    "rh_off_percent" DOUBLE PRECISION NOT NULL DEFAULT 50.00,
    "ema_alpha" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "min_on_ms" INTEGER,
    "min_off_ms" INTEGER,
    "anti_chatter" BOOLEAN DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "incubator_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fan" INTEGER[],
    "lamp" INTEGER[],
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_activation" (
    "id" TEXT NOT NULL,
    "incubator_id" TEXT NOT NULL,
    "template_id" TEXT,
    "requested_by" TEXT,
    "correlation_id" TEXT,
    "result" "activation_result" NOT NULL,
    "applied_mode" "device_mode" NOT NULL,
    "applied_lamp" INTEGER[],
    "applied_fan" INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_activation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry" (
    "id" BIGSERIAL NOT NULL,
    "incubator_id" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "temp_ds" DOUBLE PRECISION,
    "temp_dht" DOUBLE PRECISION,
    "temp_main" DOUBLE PRECISION,
    "room_humid" DOUBLE PRECISION,
    "mode" "device_mode" NOT NULL,
    "fan" INTEGER[],
    "lamp" INTEGER[],
    "gpsFix" BOOLEAN,
    "gpsSat" INTEGER,
    "gpsLat" DOUBLE PRECISION,
    "gpsLon" DOUBLE PRECISION,
    "rev" BIGINT,
    "fwVersion" TEXT,
    "raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "state" (
    "incubator_id" TEXT NOT NULL,
    "mode" "device_mode" NOT NULL,
    "current_temp_c" DECIMAL(5,2) NOT NULL,
    "current_rh_percent" DECIMAL(5,2) NOT NULL,
    "fan" INTEGER[],
    "lamp" INTEGER[],
    "rev" BIGINT NOT NULL DEFAULT 6,
    "fwVersion" TEXT,
    "gpsFix" BOOLEAN,
    "gpsSat" INTEGER,
    "gpsLat" DOUBLE PRECISION,
    "gpsLon" DOUBLE PRECISION,
    "gpsAlt" DOUBLE PRECISION,
    "active_session_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "state_pkey" PRIMARY KEY ("incubator_id")
);

-- CreateTable
CREATE TABLE "command" (
    "id" BIGSERIAL NOT NULL,
    "incubator_id" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "cmd_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "qos" INTEGER,
    "published_by" TEXT,
    "correlation_id" TEXT,
    "ack_ok" BOOLEAN,
    "ack_msg" TEXT,
    "ack_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "command_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "incubator_code_key" ON "incubator"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "incubator_session_incubator_id_started_at_idx" ON "incubator_session"("incubator_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "sensor_parameters_incubator_id_key" ON "sensor_parameters"("incubator_id");

-- CreateIndex
CREATE UNIQUE INDEX "templates_incubator_id_name_key" ON "templates"("incubator_id", "name");

-- CreateIndex
CREATE INDEX "template_activation_incubator_createdat_idx" ON "template_activation"("incubator_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "telemetry_incubator_ts_idx" ON "telemetry"("incubator_id", "ts" DESC);

-- CreateIndex
CREATE INDEX "command_incubator_created_idx" ON "command"("incubator_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "incubator" ADD CONSTRAINT "incubator_last_session_id_fkey" FOREIGN KEY ("last_session_id") REFERENCES "incubator_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incubator_session" ADD CONSTRAINT "incubator_session_incubator_id_fkey" FOREIGN KEY ("incubator_id") REFERENCES "incubator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incubator_session" ADD CONSTRAINT "incubator_session_baby_id_fkey" FOREIGN KEY ("baby_id") REFERENCES "baby_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_parameters" ADD CONSTRAINT "sensor_parameters_incubator_id_fkey" FOREIGN KEY ("incubator_id") REFERENCES "incubator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_incubator_id_fkey" FOREIGN KEY ("incubator_id") REFERENCES "incubator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_activation" ADD CONSTRAINT "template_activation_incubator_id_fkey" FOREIGN KEY ("incubator_id") REFERENCES "incubator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_activation" ADD CONSTRAINT "template_activation_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry" ADD CONSTRAINT "telemetry_incubator_id_fkey" FOREIGN KEY ("incubator_id") REFERENCES "incubator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "state" ADD CONSTRAINT "state_incubator_id_fkey" FOREIGN KEY ("incubator_id") REFERENCES "incubator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "state" ADD CONSTRAINT "state_active_session_id_fkey" FOREIGN KEY ("active_session_id") REFERENCES "incubator_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "command" ADD CONSTRAINT "command_incubator_id_fkey" FOREIGN KEY ("incubator_id") REFERENCES "incubator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
