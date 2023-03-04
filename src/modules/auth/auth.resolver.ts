import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { NewUserReturn } from './auth.types';
import { LocalAuthGuard } from './guards/local.guard';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Mutation(() => String)
  login(@Args('email') email: string, @Args('password') password: string) {
    return this.authService.login({ email, password }).access_token;
  }

  @Mutation(() => NewUserReturn)
  signup(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('name') name: string,
  ) {
    return this.authService.signup({ email, password, name });
  }
}
