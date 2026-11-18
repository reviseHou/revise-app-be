import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/domain/auth/decorator/current-user.decorator';
import { JwtAuthGuard } from 'src/domain/auth/guards/jwt.guard';
import { DocumentCategory, DocumentSort } from 'src/domain/enums';
import { Users } from 'src/domain/user/entity/user.entity';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/documents.dto';

@Controller('documents')
@ApiTags('Documents Management')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('/')
  @ApiQuery({ name: 'category', required: false, enum: DocumentCategory })
  @ApiQuery({ name: 'sort', required: false, enum: DocumentSort })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  findAll(
    @Query('category') categoryParam?: string,
    @Query('sort') sortParam?: string,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const category = Object.values(DocumentCategory).find(
      (c) => c === categoryParam,
    );
    const sort = Object.values(DocumentSort).find((s) => s === sortParam);
    const limit = Number(limitParam);
    const offset = Number(offsetParam);
    return this.documentsService.findAll(
      category,
      sort,
      Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : undefined,
      Number.isInteger(offset) && offset > 0 ? offset : undefined,
    );
  }

  @Get('/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.findOne(id, true);
  }

  @Get('/author/:authorId')
  findByAuthor(@Param('authorId') authorId: string) {
    return this.documentsService.findByUploaderId(authorId);
  }

  @Get('/subject/:subjectId')
  @ApiQuery({ name: 'category', required: false, enum: DocumentCategory })
  @ApiQuery({ name: 'sort', required: false, enum: DocumentSort })
  findBySubject(
    @Param('subjectId') subjectId: number,
    @Query('category') categoryParam?: string,
    @Query('sort') sortParam?: string,
  ) {
    const category = Object.values(DocumentCategory).find(
      (c) => c === categoryParam,
    );
    const sort = Object.values(DocumentSort).find((s) => s === sortParam);
    return this.documentsService.findBySubjectId(subjectId, category, sort);
  }

  @Post('/:id/views')
  addView(@CurrentUser() user: Users, @Param('id', ParseIntPipe) id: number) {
    return this.documentsService.addView(id, user);
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
