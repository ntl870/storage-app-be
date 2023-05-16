import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ComputersService } from './computers.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt.guard';
import { Computer } from './computers.entity';
import { ConnectComputerInput } from './computers.type';
import { CurrentUser } from '@decorators/CurrentUser';
import { User } from '@modules/user/user.entity';

@Resolver()
export class ComputersResolver {
  constructor(private readonly computersService: ComputersService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Computer)
  connectComputer(
    @CurrentUser() user: User,
    @Args('input') input: ConnectComputerInput,
  ) {
    return this.computersService.connectComputer(user.ID, input);
  }
}
