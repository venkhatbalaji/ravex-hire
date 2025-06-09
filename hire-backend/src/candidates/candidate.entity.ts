import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  resumeUrl: string;
}
