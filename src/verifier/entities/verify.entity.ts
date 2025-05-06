import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, Unique } from 'typeorm';

@Entity({ name: 'verify' })
export class Verify extends BaseEntity {
  @Column()
  name: string;

  @Column()
  did: string;

  @Column()
  email: string;

  @Column('text')
  vpHash: string;

  @Column('boolean', { default: () => false })
  verified: boolean;
}
