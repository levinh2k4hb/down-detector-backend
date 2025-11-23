import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDownDetectorSchema1732348800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "down-detector"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SCHEMA IF EXISTS "down-detector" CASCADE`);
  }
}
