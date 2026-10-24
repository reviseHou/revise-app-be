import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WEB_USER_ROLE } from 'src/constants';
import { ActiveStatus } from '../enums';
import { UsersService } from '../user/users.service';
import { Users } from '../user/entity/user.entity';
import { RefreshTokenDto } from './dto/auth.dto';
import { GoogleUser, UserJwtPayload } from './auth.type';

const REFRESH_TOKEN_EXPIRES_IN = '12h';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async findOrCreateGoogleUser(googleUser: GoogleUser) {
    const user =
      (await this.usersService.findUserById(googleUser.id)) ??
      (await this.usersService.create({
        id: googleUser.id,
        email: googleUser.email,
        fullName: googleUser.fullName,
        avatar: googleUser.avatar,
        roleCode: WEB_USER_ROLE,
      }));

    this.assertActive(user);
    return user;
  }

  async refreshToken(dto: RefreshTokenDto) {
    let decoded: UserJwtPayload;
    try {
      decoded = this.jwtService.verify<UserJwtPayload>(dto.refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.usersService.findUserById(decoded.sub);
    if (!user) throw new UnauthorizedException('Invalid refresh token');
    this.assertActive(user);
    return this.issueTokens(user);
  }

  private assertActive(user: Users) {
    if (user.status !== ActiveStatus.ACTIVE) {
      throw new UnauthorizedException('Tài khoản đã bị khoá');
    }
  }

  issueTokens(user: Users) {
    const payload: UserJwtPayload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        secret: process.env.REFRESH_TOKEN_SECRET,
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      }),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        dateCreated: user.dateCreated,
      },
    };
  }
}
