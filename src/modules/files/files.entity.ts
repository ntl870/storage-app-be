import { Folder } from '@modules/folders/folders.entity';
import { User } from '@modules/user/user.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@ObjectType()
@Entity({
  name: 'files',
})
export class File extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  ID: string;

  @Field()
  @Column()
  name: string;

  @Field(() => Folder, { nullable: true })
  @ManyToOne(() => Folder, (folder) => folder.files, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  folder: Folder;

  @Field()
  @Column()
  url: string;

  @Field(() => String)
  @Column({ name: 'fileType' })
  fileType: string;

  @Field()
  @Column({ nullable: true })
  ownerID: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user)
  @JoinColumn()
  owner: User;

  @Field()
  @Column({ default: false })
  isTrash: boolean;

  @Field()
  @Column({ default: false })
  isPublic: boolean;

  @Field()
  @Column({ nullable: true })
  fileSize: number;

  @Field(() => [User], { nullable: true })
  @ManyToMany(() => User, (user) => user)
  @JoinTable()
  sharedUsers: User[];

  @Field(() => [User], { nullable: true })
  @ManyToMany(() => User, (user) => user)
  @JoinTable()
  readonlyUsers: User[];

  @Field(() => [User], { nullable: true })
  @ManyToMany(() => User, (user) => user)
  @JoinTable()
  starredUsers: User[];

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
