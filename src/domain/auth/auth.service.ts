import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../user/users.service';
import { Users } from '../user/entity/user.entity';
import { RefreshTokenDto } from './dto/auth.dto';
import { UserJwtPayload } from './auth.type';

const REFRESH_TOKEN_EXPIRES_IN = '12h';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async loginWithGoogle(googleUser: any) {
    if (!googleUser || !googleUser.email) {
      throw new UnauthorizedException('Invalid Google user');
    }

    let user = await this.usersService.findUserbyEmail(googleUser.email);

    if (!user) {
      user = await this.usersService.create({
        email: googleUser.email,
        username: googleUser.username,
        avatarUrl: googleUser.avatarUrl,
        roleId: Number(process.env.WEB_USER_ROLE_ID),
        createdAt: new Date(),
        updateAt: new Date(),
      });
    }

    return this.issueTokens(user);
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const decoded = this.jwtService.verify<UserJwtPayload>(dto.refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });
      const user = await this.usersService.findUserById(decoded.sub);
      return this.issueTokens(user);
    } catch (error) {
      this.logger.error('Failed to refresh token', error.stack);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private issueTokens(user: Users) {
    const payload: UserJwtPayload = { sub: user.id, email: user.email };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: process.env.REFRESH_TOKEN_SECRET,
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      }),
      user,
    };
  }
}
