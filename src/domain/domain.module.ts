import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentBean } from './document/document.bean';
import { Documents } from './document/entity/document.entity';
import { FacultyBean } from './faculty/faculty.bean';
import { Faculties } from './faculty/entity/faculty.entity';
import { MajorBean } from './major/major.bean';
import { Majors } from './major/entity/major.entity';
import { PermissionBean } from './permission/permission.bean';
import { QuizBean } from './quiz/quiz.bean';
import { Questions } from './quiz/entity/question.entity';
import { Quizzes } from './quiz/entity/quiz.entity';
import { Permissions } from './permission/entity/permission.entity';
import { RoleBean } from './role/role.bean';
import { Roles } from './role/entity/role.entity';
import { RolePermissions } from './role/entity/role-permission.entity';
import { DocumentViews } from './document/entity/document-view.entity';
import { Ratings } from './rating/entity/rating.entity';
import { SubjectBean } from './subject/subject.bean';
import { Subjects } from './subject/entity/subject.entity';
import { UserBean } from './user/user.bean';
import { Users } from './user/entity/user.entity';

const beans = [
  FacultyBean,
  MajorBean,
  SubjectBean,
  DocumentBean,
  QuizBean,
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
      RolePermissions,
      DocumentViews,
      Ratings,
      Documents,
      Quizzes,
      Questions,
      Subjects,
      Faculties,
      Majors,
    ]),
  ],
  providers: beans,
  exports: beans,
})
export class DomainModule {}
