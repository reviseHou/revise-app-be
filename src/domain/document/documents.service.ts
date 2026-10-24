import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Documents } from 'src/domain/document/entity/document.entity';
import { DocumentStatus } from 'src/domain/enums';
import { Repository } from 'typeorm';
import { Subjects } from '../subject/entity/subject.entity';
import { CreateDocumentDto, UpdateDocumentDto } from './dto/documents.dto';

const WITH_RELATIONS = ['uploader', 'subject'];

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Documents)
    private documentsRepository: Repository<Documents>,
  ) {}

  async create(dto: CreateDocumentDto) {
    const { uploaderId, subjectId, ...fields } = dto;
    const document = await this.documentsRepository.save(
      this.documentsRepository.create({
        ...fields,
        uploader: { id: uploaderId },
        subject: { id: subjectId },
      }),
    );
    return this.findOne(Number(document.id));
  }

  findAll() {
    return this.documentsRepository.find({ relations: WITH_RELATIONS });
  }

  async findOne(id: number) {
    const document = await this.documentsRepository.findOne({
      where: { id: String(id) },
      relations: WITH_RELATIONS,
    });
    if (!document) throw new NotFoundException('Không tìm thấy tài liệu');
    return document;
  }

  findByUploaderId(uploaderId: string) {
    return this.documentsRepository.find({
      where: { uploader: { id: uploaderId } },
      relations: WITH_RELATIONS,
    });
  }

  findBySubjectId(subjectId: number) {
    return this.documentsRepository.find({
      where: { subject: { id: subjectId }, status: DocumentStatus.ACTIVE },
      relations: WITH_RELATIONS,
    });
  }

  async update(id: number, dto: UpdateDocumentDto) {
    const document = await this.findOne(id);
    const { subjectId, ...fields } = dto;
    this.documentsRepository.merge(document, fields);
    if (subjectId) document.subject = { id: subjectId } as Subjects;
    return this.documentsRepository.save(document);
  }

  async remove(id: number) {
    const document = await this.findOne(id);
    await this.documentsRepository.remove(document);
    return document;
  }
}
