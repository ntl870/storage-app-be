import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/decorators/CurrentUser';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { User } from './user.entity';
import { UserService } from './user.service';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => User)
  getMe(@CurrentUser() user: User) {
    return this.userService.getOneByID(user.ID);
  }
}
