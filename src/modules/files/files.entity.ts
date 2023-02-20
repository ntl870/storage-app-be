import { Folder } from '@modules/folders/folders.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@ObjectType()
@Entity({
  name: 'files',
})
export class File {
  @Field()
  @PrimaryGeneratedColumn()
  ID: number;

  @Field()
  @Column()
  name: string;

  @Field(() => Folder, { nullable: true })
  @ManyToOne(() => Folder, (folder) => folder.files)
  @JoinColumn()
  folder: Folder;

  @Field()
  @Column()
  url: string;

  @Field(() => String)
  @Column({ name: 'fileType', nullable: true })
  fileType: string;

  @Field()
  @Column({ nullable: true })
  ownerID: string;
}
