import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminsTable1732349000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "down-detector"."admins" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR NOT NULL,
        "phone_number" VARCHAR NOT NULL,
        "email" VARCHAR NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "down-detector"."admins"`);
  }
}
