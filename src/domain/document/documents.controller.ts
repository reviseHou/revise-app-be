import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/domain/auth/guards/jwt.guard';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/documents.dto';

@Controller('documents')
@ApiTags('Documents Management')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('/')
  findAll() {
    return this.documentsService.findAll();
  }

  @Get('/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.findOne(id);
  }

  @Get('/author/:authorId')
  findByAuthor(@Param('authorId') authorId: number) {
    return this.documentsService.findByAuthorId(authorId);
  }

  @Get('/subject/:subjectId')
  findBySubject(@Param('subjectId') subjectId: number) {
    return this.documentsService.findBySubjectId(subjectId);
  }

  @Patch('/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(id, dto);
  }

  @Post('/')
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Delete('/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.remove(id);
  }
}
