import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'verify' })
export class Verify extends BaseEntity {
  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  did: string;

  @Column('text')
  vpHash: string;

  @Column('boolean', { default: () => false })
  verified: boolean;

  @Column({ nullable: true })
  handler: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any> | null;
}
