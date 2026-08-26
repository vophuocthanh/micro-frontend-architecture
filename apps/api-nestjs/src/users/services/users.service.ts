import { Injectable } from '@nestjs/common';

import type { AuthenticatedUser } from '@banking/contracts';
import { permissionsForRole } from '@banking/contracts';

import { ResourceNotFoundException } from '../../common/errors/domain.exception';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  async getProfile(userId: string): Promise<AuthenticatedUser> {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new ResourceNotFoundException('User');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      permissions: [...permissionsForRole(user.role)],
    };
  }
}
