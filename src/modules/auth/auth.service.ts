import { FoldersService } from '@modules/folders/folders.service';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ErrorException } from '@utils/exceptions';
import { comparePassword } from 'src/utils/tools';
import { UserService } from '../user/user.service';
import { NewUserInput, SignInInput } from './auth.types';
import { STRIPE_PROVIDER } from '@modules/shared/stripe-provider/constants/stripe-provider.constants';
import Stripe from 'stripe';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private folderService: FoldersService,
    private jwtService: JwtService,
    @Inject(STRIPE_PROVIDER) private stripe: Stripe,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.getOne(email);
    if (!user) return false;
    return comparePassword(password, user.password);
  }

  login(userInput: SignInInput) {
    const payload = { email: userInput.email, password: userInput.password };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: 'ntlong',
      }),
    };
  }

  async signup(userInput: NewUserInput) {
    try {
      const user = await this.usersService.getOne(userInput.email);
      if (user) {
        throw ErrorException.badRequest('User already exists');
      }

      const customer = await this.stripe.customers.create({
        email: userInput.email,
        name: userInput.name,
      });
      const newUser = await this.usersService.create({
        ...userInput,
        stripeCustomerID: customer.id,
      });

      const payload = {
        email: userInput.email,
        password: userInput.password,
      };

      const accessToken = this.jwtService.sign(payload, {
        secret: 'ntlong',
      });

      return {
        accessToken,
        name: newUser.name,
        email: newUser.email,
      };
    } catch (err) {
      throw err;
    }
  }
}
