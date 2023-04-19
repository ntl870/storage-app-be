import { Folder } from '@modules/folders/folders.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@ObjectType()
@Entity({
  name: 'users',
})
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  ID: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  email: string;

  @Field()
  @Column()
  password: string;

  @Field(() => Folder, { nullable: true })
  @ManyToOne(() => Folder, (folder) => folder)
  @JoinColumn()
  rootFolder: Folder;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  avatar: string;
}
