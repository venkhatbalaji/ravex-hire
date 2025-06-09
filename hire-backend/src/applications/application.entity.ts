import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Candidate } from '../candidates/candidate.entity';
import { Opportunity } from '../opportunities/opportunity.entity';

@Entity()
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Candidate)
  candidate: Candidate;

  @ManyToOne(() => Opportunity)
  opportunity: Opportunity;

  @CreateDateColumn()
  createdAt: Date;
}
