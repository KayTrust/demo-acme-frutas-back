import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateVerify1778215145661 implements MigrationInterface {
    name = 'UpdateVerify1778215145661'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_verify" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "email" varchar NOT NULL, "did" varchar NOT NULL, "vpHash" text NOT NULL, "verified" boolean NOT NULL DEFAULT (false), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "handler" varchar, "metadata" text)`);
        await queryRunner.query(`INSERT INTO "temporary_verify"("id", "name", "email", "did", "vpHash", "verified", "createdAt", "updatedAt", "handler", "metadata") SELECT "id", "name", "email", "did", "vpHash", "verified", "createdAt", "updatedAt", "handler", "metadata" FROM "verify"`);
        await queryRunner.query(`DROP TABLE "verify"`);
        await queryRunner.query(`ALTER TABLE "temporary_verify" RENAME TO "verify"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "verify" RENAME TO "temporary_verify"`);
        await queryRunner.query(`CREATE TABLE "verify" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "email" varchar NOT NULL, "did" varchar NOT NULL, "vpHash" text NOT NULL, "verified" boolean NOT NULL DEFAULT (false), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "handler" varchar, "metadata" text)`);
        await queryRunner.query(`INSERT INTO "verify"("id", "name", "email", "did", "vpHash", "verified", "createdAt", "updatedAt", "handler", "metadata") SELECT "id", "name", "email", "did", "vpHash", "verified", "createdAt", "updatedAt", "handler", "metadata" FROM "temporary_verify"`);
        await queryRunner.query(`DROP TABLE "temporary_verify"`);
    }

}
