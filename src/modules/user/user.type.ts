import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
export class UserSearchPaginationResponse {
  @Field(() => [User])
  results: User[];

  @Field()
  hasMore: boolean;
}

@InputType()
export class UpdateUserPayload {
  @Field(() => String)
  name: string;

  @Field(() => String)
  avatar: string;
}
