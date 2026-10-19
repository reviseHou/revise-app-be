import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Documents } from 'src/domain/document/entity/document.entity';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AuthModule } from 'src/domain/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Documents]),
    forwardRef(() => AuthModule),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
