import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from 'src/domain/user/entity/user.entity';
import { Roles } from 'src/domain/role/entity/role.entity';
import { CreateUserInput } from './dto/users.dto';

const WITH_PERMISSIONS = [
  'role',
  'role.rolePermissions',
  'role.rolePermissions.permission',
  'faculty',
];

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Roles)
    private readonly roleRepository: Repository<Roles>,
  ) {}

  async create(input: CreateUserInput) {
    const role = await this.roleRepository.findOneBy({ code: input.roleCode });
    if (!role)
      throw new NotFoundException(
        `Chưa có vai trò ${input.roleCode} trong bảng role`,
      );
    const result = await this.usersRepository.save(
      this.usersRepository.create({
        id: input.id,
        email: input.email,
        fullName: input.fullName,
        avatar: input.avatar,
        role,
      }),
    );
    this.logger.log(`User created with id: ${result.id}`);
    return this.findUserById(result.id) as Promise<Users>;
  }

  findUserById(id: string) {
    return this.usersRepository.findOne({
      where: { id },
      relations: WITH_PERMISSIONS,
    });
  }
}

export function permissionCodesOf(user: Users): string[] {
  return user.role.rolePermissions.map(
    (rolePermission) => rolePermission.permission.code,
  );
}
