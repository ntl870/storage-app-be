import { User } from '@modules/user/user.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity({
  name: 'computers',
})
export class Computer extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  ID: string;

  @Field()
  @Column()
  macAddress: string;

  @Field()
  @Column()
  hostname: string;

  @Field()
  @Column()
  storagePath: string;

  @Field()
  @Column()
  name: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user)
  @JoinColumn()
  user: User;

  @Field(() => Date, { nullable: true })
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdDate: Date;

  @Field(() => Date, { nullable: true })
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  modifiedDate: Date;
}
