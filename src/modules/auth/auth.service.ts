import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.getOne(email);
    const isValidated = password === user.password;

    if (user && isValidated) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  login(userInput: any) {
    const payload = { email: userInput.email, password: userInput.password };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: 'ntlong',
      }),
    };
  }
}
