import { Field, InputType } from '@nestjs/graphql';
import { GraphQLUpload, Upload } from 'graphql-upload';

@InputType()
export class NewFolderInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  rootFolderID?: string;
}

interface UploadFolder {
  files: Upload[];
  folders: {
    [name: string]: UploadFolder;
  };
}

@InputType()
export class UploadFolderInput {
  @Field(() => [NewFolderInput])
  folder: UploadFolder;

  @Field(() => String)
  rootFolderID: string;
}
