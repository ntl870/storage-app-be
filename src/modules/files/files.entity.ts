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

  @Field(() => String, { nullable: true })
  @ManyToOne(() => Folder, (folder) => folder.ID)
  @JoinColumn()
  folder: string;

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
