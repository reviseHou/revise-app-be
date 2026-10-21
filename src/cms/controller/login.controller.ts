import {
  Controller,
  Get,
  Post,
  Render,
  Req,
  Res,
  UseFilters,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CMS_SESSION_COOKIE } from '../util/cms.auth';
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
  logout(@Req() request: Request, @Res() response: Response) {
    request.session.destroy(() => {
      response.clearCookie(CMS_SESSION_COOKIE);
      response.redirect('/cms/login');
    });
  }
}
