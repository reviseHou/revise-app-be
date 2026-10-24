import { Module } from '@nestjs/common';

import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/domain/user/entity/user.entity';
import { Roles } from 'src/domain/role/entity/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users, Roles])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
