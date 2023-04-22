import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity({
  name: 'packages',
})
export class Package extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  ID: number;

  @Field()
  @Column()
  price: number;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  maxStorage: number;

  @Field()
  @Column()
  detail: string;
}
