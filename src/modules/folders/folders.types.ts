import { User } from '@modules/user/user.entity';
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { GraphQLUpload, Upload } from 'graphql-upload';

@InputType()
export class NewFolderInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  rootFolderID?: string;
}

@InputType()
class UploadFolder {
  @Field(() => [GraphQLUpload], { nullable: true })
  files: Upload[];

  @Field(() => [UploadFolder], { nullable: true })
  folders: UploadFolder[];

  @Field(() => String)
  name: string;
}

@InputType()
export class UploadFolderInput {
  @Field(() => UploadFolder)
  folder: UploadFolder;

  @Field(() => String)
  rootFolderID: string;
}

@ObjectType()
export class PeopleWithAccessResponse {
  @Field(() => [User])
  sharedUsers: User[];

  @Field(() => [User])
  readonlyUsers: User[];

  @Field(() => User)
  owner: User;

  @Field(() => Boolean)
  isPublic: boolean;
}
