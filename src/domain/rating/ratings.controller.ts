import {
  Body,
  Controller,
  Delete,
  Get,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/domain/auth/decorator/current-user.decorator';
import { JwtAuthGuard } from 'src/domain/auth/guards/jwt.guard';
import { Users } from 'src/domain/user/entity/user.entity';
import { SourceKeyDto } from '../validation';
import { RateDto } from './dto/ratings.dto';
import { RatingsService } from './ratings.service';

@Controller('ratings')
@ApiTags('Ratings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Get('/summary')
  summary(@CurrentUser() user: Users, @Query() query: SourceKeyDto) {
    return this.ratingsService.summary(user, query);
  }

  @Put('/')
  rate(@CurrentUser() user: Users, @Body() body: RateDto) {
    return this.ratingsService.rate(user, body);
  }

  @Delete('/')
  remove(@CurrentUser() user: Users, @Query() query: SourceKeyDto) {
    return this.ratingsService.remove(user, query);
  }
}
