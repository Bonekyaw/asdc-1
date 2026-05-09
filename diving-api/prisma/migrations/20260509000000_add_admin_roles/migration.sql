CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'MANAGER', 'EDITOR', 'STAFF');

ALTER TABLE "user" ADD COLUMN "adminRole" "AdminRole";

UPDATE "user"
SET "adminRole" = 'SUPER_ADMIN'
WHERE "role" = 'ADMIN' AND "adminRole" IS NULL;
