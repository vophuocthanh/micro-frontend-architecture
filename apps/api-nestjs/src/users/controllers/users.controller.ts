import { Controller, Get } from '@nestjs/common';

import type { AuthenticatedUser } from '@banking/contracts';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from '../services/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /**
   * The shell calls this after a page reload to rehydrate the session: the
   * access token lives in memory only, so it is gone, and the refresh cookie is
   * what proves who the user is.
   */
  @Get('me')
  getCurrentUser(@CurrentUser() user: AuthenticatedUser): Promise<AuthenticatedUser> {
    return this.users.getProfile(user.id);
  }
}
