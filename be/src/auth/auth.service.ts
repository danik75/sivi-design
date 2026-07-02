import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async login(username: string, password: string) {
    const user = await this.userRepository.findByUsername(username);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = user.password.startsWith('$2')
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const secret = process.env.JWT_SECRET || 'devsecret';
    if (!secret) throw new InternalServerErrorException('JWT_SECRET not configured');

    const expiresInMinutes = parseInt(process.env.JWT_EXPIRATION_MINUTES || '30', 10);

    const token = jwt.sign({ sub: user.id, username: user.username }, secret, {
      algorithm: 'HS256',
      expiresIn: `${expiresInMinutes}m`,
    });

    return { access_token: token };
  }
}
