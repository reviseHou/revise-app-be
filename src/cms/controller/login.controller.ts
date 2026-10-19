import {
  Controller,
  Get,
  Post,
  Render,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CMS_SESSION_COOKIE } from 'src/domain/auth/auth.constants';
import { CsrfGuard } from '../csrf.guard';
import { CmsErrorFilter } from '../error.filter';

@Controller('cms')
@UseFilters(CmsErrorFilter)
@ApiExcludeController()
export class LoginController {
  @Get('login')
  @Render('login')
  showLoginForm() {
    return { layout: false };
  }

  @Post('logout')
  @UseGuards(CsrfGuard)
  logout(@Req() request: Request, @Res() response: Response) {
    request.session.destroy(() => {
      response.clearCookie(CMS_SESSION_COOKIE);
      response.redirect('/cms/login');
    });
  }
}
