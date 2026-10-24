import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../user/users.service';
import { UserJwtPayload } from '../auth.type';
import { ActiveStatus } from '../../enums';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('SECRET_KEY'),
    });
  }

  async validate(payload: UserJwtPayload) {
    const user = await this.usersService.findUserById(payload.sub);
    if (!user || user.status !== ActiveStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or has been locked');
    }
    return user;
  }
}
