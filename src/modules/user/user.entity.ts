import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field()
  ID: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  password: string;
}
