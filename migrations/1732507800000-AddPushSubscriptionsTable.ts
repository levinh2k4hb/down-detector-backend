import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPushSubscriptionsTable1732507800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "down-detector"."push_subscriptions" (
        "id" SERIAL PRIMARY KEY,
        "subscription" JSONB NOT NULL,
        "admin_id" INTEGER NOT NULL REFERENCES "down-detector"."admins"(id) ON DELETE CASCADE,
        "endpoint" VARCHAR NOT NULL,
        "user_agent" VARCHAR,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_push_subscriptions_admin_active" 
      ON "down-detector"."push_subscriptions"("admin_id", "is_active")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_push_subscriptions_endpoint" 
      ON "down-detector"."push_subscriptions"("endpoint")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_push_subscriptions_admin_endpoint_unique" 
      ON "down-detector"."push_subscriptions"("admin_id", "endpoint")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "down-detector"."idx_push_subscriptions_admin_endpoint_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "down-detector"."idx_push_subscriptions_endpoint"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "down-detector"."idx_push_subscriptions_admin_active"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "down-detector"."push_subscriptions"`);
  }
}