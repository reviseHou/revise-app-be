import { Controller, Get, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/domain/auth/guards/jwt.guard';

@ApiTags('Subjects Management')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get('/')
  findAll() {
    return this.subjectsService.findAll();
  }
}
