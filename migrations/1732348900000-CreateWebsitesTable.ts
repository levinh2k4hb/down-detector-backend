import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWebsitesTable1732348900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "down-detector"."websites" (
        "id" SERIAL PRIMARY KEY,
        "domain" VARCHAR NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "down-detector"."websites"`);
  }
}
