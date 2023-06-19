import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CheckoutSession {
  @Field(() => String)
  id: string;
}
