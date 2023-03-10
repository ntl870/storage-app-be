import { Folder } from '@modules/folders/folders.entity';
import { Field, ObjectType } from '@nestjs/graphql';
import {
  BaseEntity,
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

  @Field()
  @Column({ default: false })
  isTrash: boolean;
}
