import { Field, InputType } from '@nestjs/graphql';
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
