import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async login(username: string, password: string) {
    const user = await this.userRepository.findByUsername(username);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // DEV-ONLY: The development seed stores passwords in cleartext. This direct comparison is
    // intentionally simple for local development. In production replace with bcrypt.compare
    // against a hashed password.
    if (password !== user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new InternalServerErrorException('JWT_SECRET not configured');

    const expiresInMinutes = parseInt(process.env.JWT_EXPIRATION_MINUTES || '30', 10);

    const token = jwt.sign({ sub: user.id, username: user.username }, secret, {
      algorithm: 'HS256',
      expiresIn: `${expiresInMinutes}m`,
    });

    return { access_token: token };
  }
}
