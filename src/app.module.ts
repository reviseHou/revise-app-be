import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/domain/user/entity/user.entity';
import { AuthModule } from './domain/auth/auth.module';
import { UsersModule } from './domain/user/user.module';
import { Roles } from 'src/domain/role/entity/role.entity';
import { Permissions } from 'src/domain/permission/entity/permission.entity';
import { SubjectsModule } from './domain/subject/subjects.module';
import { DocumentsModule } from './domain/document/document.module';
import { UploadModule } from './domain/upload/upload.module';
import { CmsModule } from './cms/cms.module';
import { QuizModule } from './domain/quiz/quiz.module';
import { CommentModule } from './domain/comment/comment.module';
import { SavedModule } from './domain/saved/saved.module';
import { RatingModule } from './domain/rating/rating.module';
import { SnakeNamingStrategy } from './database/snake-naming.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? '5432'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        entities: [Users, Permissions, Roles],
        namingStrategy: new SnakeNamingStrategy(),
        database: process.env.DB_NAME,
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),
    AuthModule,
    UsersModule,
    SubjectsModule,
    DocumentsModule,
    UploadModule,
    QuizModule,
    CommentModule,
    SavedModule,
    RatingModule,
    CmsModule,
  ],
})
export class AppModule {}
