import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/domain/auth/decorator/current-user.decorator';
import { JwtAuthGuard } from 'src/domain/auth/guards/jwt.guard';
import { Users } from 'src/domain/user/entity/user.entity';
import { SavedItemDto } from './dto/saved.dto';
import { SavedService } from './saved.service';

@Controller('saved')
@ApiTags('Saved items')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class SavedController {
  constructor(private readonly savedService: SavedService) {}

  @Get('/')
  list(@CurrentUser() user: Users) {
    return this.savedService.list(user);
  }

  @Get('/keys')
  keys(@CurrentUser() user: Users) {
    return this.savedService.keys(user);
  }

  @Post('/')
  save(@CurrentUser() user: Users, @Body() body: SavedItemDto) {
    return this.savedService.save(user, body);
  }

  @Delete('/')
  remove(@CurrentUser() user: Users, @Query() query: SavedItemDto) {
    return this.savedService.remove(user, query);
  }
}
