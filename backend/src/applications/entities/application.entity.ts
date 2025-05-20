// apps/api/src/applications/entities/application.entity.ts
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'applications' })
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: 'APPLIED' }) // Example field, ensure it aligns with task
  status: string; // Placeholder, full entity has more fields

  // Add other fields as per the full entity definition from Phase 1 later
}
