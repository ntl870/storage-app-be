import { Field, InputType, ObjectType } from '@nestjs/graphql';

@InputType()
export class NewFileInput {
  @Field()
  name: string;
}
