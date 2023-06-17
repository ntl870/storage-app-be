import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
export class UserSearchPaginationResponse {
  @Field(() => [User])
  results: User[];

  @Field()
  hasMore: boolean;

  @Field()
  total: number;
}

@InputType()
export class UpdateUserPayload {
  @Field(() => String)
  name: string;

  @Field(() => String)
  avatar: string;
}


@ObjectType()
export class StatisticPackage {
  @Field()
  total: number;

  @Field()
  packages_name: string;
}

@ObjectType()
export class StoragePercentage{
  @Field()
  used: number;

  @Field()
  total: number;
}
@ObjectType()
export class SystemOverviews {
  @Field()
  totalUsers: number;

  @Field()
  totalTransactions: number;

  @Field()
  totalIncome: number;

  @Field()
  totalComputers: number;

  @Field(() => StoragePercentage)
  storagePercentage: StoragePercentage;
}