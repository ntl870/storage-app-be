import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ConnectComputerInput {
  @Field()
  macAddress: string;

  @Field()
  hostname: string;

  @Field()
  storagePath: string;

  @Field()
  name: string;
}
