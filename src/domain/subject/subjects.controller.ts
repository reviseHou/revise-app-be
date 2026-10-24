import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SubjectjsService } from './subjectjs.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateSubjectDto } from './dto/subjects.dto';
import { JwtAuthGuard } from 'src/domain/auth/guards/jwt.guard';

@ApiTags('Subjects Management')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectjsService) {}

  @Get('/')
  findAll() {
    return this.subjectsService.findAll();
  }

  @Post('/')
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(dto);
  }
}
