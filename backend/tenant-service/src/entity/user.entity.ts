import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Tenant } from './tenant.entity';

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYER = 'employer',
  CANDIDATE = 'candidate',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CANDIDATE })
  role: UserRole;

  @ManyToOne(() => Tenant, (tenant) => tenant.users)
  tenant: Tenant;
}
