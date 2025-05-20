// apps/api/src/database/migrations/1670000000000-InitialSchema.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class InitialSchema1670000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users Table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid', // This often requires pgcrypto extension in PostgreSQL
            // default: 'uuid_generate_v4()', // Or let the application generate UUIDs
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
        ],
      }),
      true, // true creates the table if it doesn't exist
    );

    // Organizations Table
    await queryRunner.createTable(
      new Table({
        name: 'organizations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            // default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
          },
        ],
      }),
      true,
    );

    // Job Postings Table
    await queryRunner.createTable(
      new Table({
        name: 'job_postings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            // default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
          },
        ],
      }),
      true,
    );

    // Candidate Profiles Table
    await queryRunner.createTable(
      new Table({
        name: 'candidate_profiles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            // default: 'uuid_generate_v4()',
          },
          {
            name: 'headline',
            type: 'varchar',
            isNullable: true, // As per placeholder entity
            isUnique: true, // As per placeholder entity
          },
        ],
      }),
      true,
    );

    // Applications Table
    await queryRunner.createTable(
      new Table({
        name: 'applications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            // default: 'uuid_generate_v4()',
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'APPLIED'", // As per placeholder entity
          },
        ],
      }),
      true,
    );

    // Subscriptions Table
    await queryRunner.createTable(
      new Table({
        name: 'subscriptions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            // default: 'uuid_generate_v4()',
          },
          {
            name: 'plan',
            type: 'varchar',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('subscriptions');
    await queryRunner.dropTable('applications');
    await queryRunner.dropTable('candidate_profiles');
    await queryRunner.dropTable('job_postings');
    await queryRunner.dropTable('organizations');
    await queryRunner.dropTable('users');
  }
}
