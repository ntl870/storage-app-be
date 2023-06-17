import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TRANSACTION_STATUS } from '../../../types';

@ObjectType()
@Entity({
  name: 'transactions',
})
export class Transaction extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  ID: number;

  @Field()
  @Column()
  amount: number;

  @Field()
  @Column()
  packageId: number;

  @Field()
  @Column()
  userId: string;

  @Field({ nullable: true})
  @Column({ nullable: true })
  stripeTransactionId?: string;

  @Field()
  @Column()
  status: TRANSACTION_STATUS;

  @Field(() => Date, { nullable: true })
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date;
}