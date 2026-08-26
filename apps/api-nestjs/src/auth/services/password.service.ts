import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

/**
 * Password hashing kept behind a service so the algorithm is a one-file change.
 * The cost factor is deliberately slow: it is the only defence that still works
 * after the password table has already been stolen.
 */
@Injectable()
export class PasswordService {
  private readonly costFactor = 12;

  hash(plainText: string): Promise<string> {
    return hash(plainText, this.costFactor);
  }

  verify(plainText: string, passwordHash: string): Promise<boolean> {
    return compare(plainText, passwordHash);
  }
}
