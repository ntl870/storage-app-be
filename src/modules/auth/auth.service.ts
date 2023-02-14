import { FoldersService } from '@modules/folders/folders.service';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { comparePassword } from 'src/utils/tools';
import { UserService } from '../user/user.service';
import { NewUserInput, SignInInput } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private folderService: FoldersService,
    private jwtService: JwtService,
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
    const user = await this.usersService.getOne(userInput.email);

    if (!user) {
      const payload = { email: userInput.email, password: userInput.password };
      const newUser = await this.usersService.create(userInput);
      const accessToken = this.jwtService.sign(payload, {
        secret: 'ntlong',
      });

      return {
        accessToken,
        name: newUser.name,
        email: newUser.email,
      };
    }

    throw new Error('User already exists');
  }
}
