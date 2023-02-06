import { Injectable } from '@nestjs/common';
import { User } from './user.entity';

@Injectable()
export class UserService {
  getOne(email: string): User {
    if (email === 'test@gmail.com')
      return {
        name: 'John Doe',
        email: 'test@gmail.com',
        password: '123456',
        ID: '1',
      };

    return null;
  }
}
