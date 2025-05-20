// apps/api/src/subscriptions/entities/subscription.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity'; // Import Organization entity

@Entity({ name: 'subscriptions' })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  plan: string; // Example: FREE, BASIC, PREMIUM

  // Minimal inverse relation for Organization.subscription
  @OneToOne(() => Organization, organization => organization.subscription, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' }) // This makes Subscription the owner (subscription table has organization_id)
  organization: Organization;

  @Column({ name: 'organization_id', type: 'uuid', unique: true }) // Ensure unique as it's OneToOne
  organizationId: string;

  // Add other fields as per the full entity definition from Phase 1 later
}
