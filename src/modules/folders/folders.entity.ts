import { Field, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinColumn,
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

  @Field(() => [File], { nullable: true })
  @OneToMany(() => File, (file) => file.folder)
  @JoinColumn()
  files: File[];
}
