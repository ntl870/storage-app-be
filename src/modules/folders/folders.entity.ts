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

  @Field()
  @Column()
  ownerID: string;

  @Field(() => String)
  @Column({ nullable: true })
  path?: string;

  @Field(() => Boolean)
  @Column({ default: false })
  isTrash: boolean;

  @Field(() => [User], { nullable: true })
  @OneToMany(() => User, (user) => user.ID)
  @JoinColumn()
  sharedUsers?: User[];

  @Field(() => [User], { nullable: true })
  @OneToMany(() => User, (user) => user.ID)
  @JoinColumn()
  readonlyUsers?: User[];

  @Field(() => Boolean)
  @Column({ default: false })
  isPublic: boolean;
}
