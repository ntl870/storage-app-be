import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StatisticTransaction {
  @Field() 
  amount: number;

  @Field()
  date: string;
}
