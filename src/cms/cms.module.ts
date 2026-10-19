import { Module } from '@nestjs/common';
import { AuthModule } from 'src/domain/auth/auth.module';
import { UsersModule } from 'src/domain/user/user.module';
import { DomainModule } from 'src/domain/domain.module';
import { DocumentController } from './controller/document.controller';
import { FacultyController } from './controller/faculty.controller';
import { HomeController } from './controller/home.controller';
import { LoginController } from './controller/login.controller';
import { MajorController } from './controller/major.controller';
import { PermissionController } from './controller/permission.controller';
import { RoleController } from './controller/role.controller';
import { SubjectController } from './controller/subject.controller';
import { UserController } from './controller/user.controller';

@Module({
  imports: [AuthModule, DomainModule, UsersModule],
  controllers: [
    LoginController,
    HomeController,
    FacultyController,
    MajorController,
    SubjectController,
    DocumentController,
    UserController,
    RoleController,
    PermissionController,
  ],
})
export class CmsModule {}
