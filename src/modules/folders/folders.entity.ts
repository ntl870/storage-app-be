import { Field, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { File } from '@modules/files/files.entity';
@ObjectType()
@Entity({
  name: 'folders',
})
export class Folder {
  @Field()
  @PrimaryGeneratedColumn()
  ID: string;

  @Field()
  @Column()
  name: string;

  @Field(() => Folder, { nullable: true })
  @ManyToOne(() => Folder, (folder) => folder.ID)
  @JoinColumn()
  rootFolder: Folder;

  @Field(() => [File], { nullable: true })
  @OneToMany(() => File, (file) => file.folder)
  @JoinColumn()
  files: File[];

  @Field(() => [Folder], { nullable: true })
  @OneToMany(() => Folder, (folder) => folder)
  @JoinColumn()
  folders: Folder[];

  @Field()
  @Column()
  ownerID: string;

  @Field(() => String)
  @Column({ nullable: true })
  path?: string;
}
