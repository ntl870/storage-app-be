import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class NewFileInput {
  @Field()
  name: string;
}

@InputType()
export class UpdateFileInput {
  @Field()
  name: string;
}
