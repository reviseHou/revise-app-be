import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { Request, Response } from 'express';
import { startCmsSession } from 'src/cms/util/cms.auth';
import type { GoogleUser } from './auth.type';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const HOU_EMAIL = /^[^@]+@([\w-]+\.)*hou\.edu\.vn$/;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('refresh-token')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as GoogleUser;
    const fromCms = req.query.state === 'cms';
    if (!HOU_EMAIL.test(googleUser.email)) {
      return fromCms
        ? this.backToCmsLogin(
            req,
            res,
            'Chỉ chấp nhận tài khoản email của trường',
          )
        : res.redirect(`${FRONTEND_URL}/login?error=unauthorized_email`);
    }
    return fromCms
      ? this.loginCms(req, res, googleUser)
      : this.loginWeb(res, googleUser);
  }

  private async loginWeb(res: Response, googleUser: GoogleUser) {
    const account = await this.authService.findOrCreateGoogleUser(googleUser);
    const data = this.authService.issueTokens(account);
    const params = new URLSearchParams({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: JSON.stringify(data.user),
    });
    return res.redirect(`${FRONTEND_URL}/auth/callback?${params.toString()}`);
  }

  private async loginCms(req: Request, res: Response, googleUser: GoogleUser) {
    const account = await this.authService
      .findOrCreateGoogleUser(googleUser)
      .catch(() => null);
    if (!account) return this.backToCmsLogin(req, res, 'Tài khoản đã bị khoá');
    return (await startCmsSession(req, account))
      ? res.redirect('/cms')
      : this.backToCmsLogin(req, res, 'Tài khoản không có quyền vào CMS');
  }

  private backToCmsLogin(req: Request, res: Response, content: string) {
    req.session.info = { type: 'error', content };
    return res.redirect('/cms/login');
  }
}
