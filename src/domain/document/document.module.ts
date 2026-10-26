import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Documents } from 'src/domain/document/entity/document.entity';
import { DocumentViews } from './entity/document-view.entity';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AuthModule } from 'src/domain/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Documents, DocumentViews]),
    forwardRef(() => AuthModule),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
