import { Computer } from '@modules/computers/computers.entity';
import { Folder } from '@modules/folders/folders.entity';
import { Package } from '@modules/packages/entities/package.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
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

  @Field()
  @ManyToOne(() => Package, (pkg) => pkg)
  @JoinColumn()
  currentPackage: Package;

  @Field(() => Number)
  @Column({ default: 0, type: 'bigint' })
  storageUsed: number;

  @Field()
  @Column()
  stripeCustomerID?: string;

  @Field({ nullable: true})
  @Column({ default: false, nullable: true})
  isAdmin?: boolean;

  @Field(() => [Computer], { nullable: true })
  @OneToMany(() => Computer, (computer) => computer.user)
  @JoinColumn()
  computers: Computer[];
}
