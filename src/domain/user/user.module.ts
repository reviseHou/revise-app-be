import { Module } from '@nestjs/common';
import { forwardRef } from '@nestjs/common';

import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/domain/user/entity/user.entity';
import { UsersController } from './users.controller';
import { AuthModule } from 'src/domain/auth/auth.module';
import { Roles } from 'src/domain/role/entity/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Roles]),
    forwardRef(() => AuthModule),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
