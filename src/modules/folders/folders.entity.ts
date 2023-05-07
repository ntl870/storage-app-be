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
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { File } from '@modules/files/files.entity';
import { User } from '@modules/user/user.entity';
@ObjectType()
@Entity({
  name: 'folders',
})
export class Folder extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  ID: string;

  @Field()
  @Column()
  name: string;

  @Field(() => Folder, { nullable: true })
  @ManyToOne(() => Folder, (folder) => folder.ID, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  rootFolder: Folder;

  @Field(() => [File], { nullable: true })
  @OneToMany(() => File, (file) => file.folder, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  files: File[];

  @Field(() => [Folder], { nullable: true })
  @OneToMany(() => Folder, (folder) => folder.rootFolder, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  subFolders: Folder[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  ownerID: string;

  @Field(() => User, { nullable: true })
  @JoinColumn()
  @ManyToOne(() => User, (user) => user)
  owner: User;

  @Field(() => String)
  @Column({ nullable: true })
  path?: string;

  @Field(() => Boolean)
  @Column({ default: false })
  isTrash: boolean;

  @Field(() => [User], { nullable: true })
  @ManyToMany(() => User, (user) => user)
  @JoinTable()
  sharedUsers: User[];

  @Field(() => [User], { nullable: true })
  @ManyToMany(() => User, (user) => user)
  @JoinTable()
  readonlyUsers: User[];

  @Field(() => Boolean)
  @Column({ default: false })
  isPublic: boolean;

  @Field(() => [User], { nullable: true })
  @ManyToMany(() => User, (user) => user)
  @JoinTable()
  starredUsers: User[];

  @Field(() => Date, { nullable: true })
  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdDate: Date;

  @Field(() => Date, { nullable: true })
  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  modifiedDate: Date;
}
