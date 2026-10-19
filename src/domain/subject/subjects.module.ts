import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subjects } from 'src/domain/subject/entity/subject.entity';
import { SubjectsController } from './subjects.controller';
import { SubjectjsService } from './subjectjs.service';
import { AuthModule } from 'src/domain/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Subjects]), forwardRef(() => AuthModule)],
  controllers: [SubjectsController],
  providers: [SubjectjsService],
})
export class SubjectsModule {}
