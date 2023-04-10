import { Field, ObjectType } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
export class UserSearchPaginationResponse {
  @Field(() => [User])
  results: User[];

  @Field()
  hasMore: boolean;
}
