import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentBean } from './document/document.bean';
import { Documents } from './document/entity/document.entity';
import { FacultyBean } from './faculty/faculty.bean';
import { Faculties } from './faculty/entity/faculty.entity';
import { MajorBean } from './major/major.bean';
import { Majors } from './major/entity/major.entity';
import { PermissionBean } from './permission/permission.bean';
import { Permissions } from './permission/entity/permission.entity';
import { RoleBean } from './role/role.bean';
import { Roles } from './role/entity/role.entity';
import { SubjectBean } from './subject/subject.bean';
import { Subjects } from './subject/entity/subject.entity';
import { UserBean } from './user/user.bean';
import { Users } from './user/entity/user.entity';

const beans = [
  FacultyBean,
  MajorBean,
  SubjectBean,
  DocumentBean,
  UserBean,
  RoleBean,
  PermissionBean,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      Roles,
      Permissions,
      Documents,
      Subjects,
      Faculties,
      Majors,
    ]),
  ],
  providers: beans,
  exports: beans,
})
export class DomainModule {}
