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

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const HOU_EMAIL = /^[^@]+@([a-zA-Z0-9_\-]+\.)*hou\.edu\.vn$/;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('refresh-token')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    if (req.query?.state === 'cms') {
      return this.loginCms(req, res);
    }

    const email = req.user?.email;
    if (!email || !HOU_EMAIL.test(email)) {
      return res.redirect(`${FRONTEND_URL}/login?error=unauthorized_email`);
    }

    const data = await this.authService.loginWithGoogle(req.user);

    const params = new URLSearchParams({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: JSON.stringify(data.user),
    });

    return res.redirect(`${FRONTEND_URL}/auth/callback?${params.toString()}`);
  }

  private async loginCms(req: Request, res: Response) {
    const googleUser = req.user as { email?: string } | undefined;
    const toLogin = (content: string) => {
      req.session.info = { type: 'error', content };
      return res.redirect('/cms/login');
    };
    if (!googleUser?.email || !HOU_EMAIL.test(googleUser.email)) {
      return toLogin('Chỉ chấp nhận tài khoản email của trường');
    }
    const { user } = await this.authService.loginWithGoogle(googleUser);
    return (await startCmsSession(req, user))
      ? res.redirect('/cms')
      : toLogin('Tài khoản không có quyền vào CMS');
  }
}
