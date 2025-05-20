// apps/api/src/candidates/entities/candidate-profile.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Import User entity

@Entity({ name: 'candidate_profiles' })
export class CandidateProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, type: 'varchar', nullable: true })
  headline?: string;

  // Inverse side of the OneToOne relation from User
  // The User entity is the owner of the relationship if it has cascade:true and no JoinColumn there.
  // If this side should be the owner (i.e., candidate_profiles table has user_id),
  // then User.candidateProfile should not have @JoinColumn.
  // For now, assuming User.candidateProfile is the owner as per the provided User entity.
  // To make this side the owner, uncomment @JoinColumn and remove it from User.candidateProfile.
  @OneToOne(() => User, user => user.candidateProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) // This makes CandidateProfile the owner of the relationship
  user: User;

  @Column({ type: 'uuid', name: 'user_id', unique: true }) // Foreign key column
  userId: string;


  // Add other fields as per the full entity definition from Phase 1 later
}
