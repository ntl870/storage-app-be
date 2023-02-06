import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const email = context.getArgByIndex(1).email;
    const password = context.getArgByIndex(1).password;
    const isValidated = Boolean(
      await this.authService.validateUser(email, password),
    );

    if (!isValidated) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
