import { Field, InputType, ObjectType } from '@nestjs/graphql';

@InputType()
export class NewUserInput {
  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  password: string;
}

@InputType()
export class SignInInput {
  @Field()
  email: string;

  @Field()
  password: string;
}

@ObjectType()
export class NewUserReturn {
  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  accessToken: string;
}
