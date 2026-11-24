import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subjects } from 'src/domain/subject/entity/subject.entity';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subjects)
    private subjectsRepository: Repository<Subjects>,
  ) {}

  findAll() {
    return this.subjectsRepository.find({
      relations: { major: { faculty: true } },
      order: { name: 'ASC' },
    });
  }
}
