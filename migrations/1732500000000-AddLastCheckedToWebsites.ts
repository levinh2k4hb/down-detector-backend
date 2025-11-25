import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLastCheckedToWebsites1732500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'down-detector.websites',
      new TableColumn({
        name: 'last_checked',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'down-detector.websites',
      new TableColumn({
        name: 'created_at',
        type: 'timestamp',
        default: 'CURRENT_TIMESTAMP',
      }),
    );

    await queryRunner.addColumn(
      'down-detector.websites',
      new TableColumn({
        name: 'updated_at',
        type: 'timestamp',
        default: 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('down-detector.websites', 'last_checked');
    await queryRunner.dropColumn('down-detector.websites', 'created_at');
    await queryRunner.dropColumn('down-detector.websites', 'updated_at');
  }
}
