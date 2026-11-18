import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import * as crypto from 'crypto';
import { JwtAuthGuard } from 'src/domain/auth/guards/jwt.guard';

const INLINE_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];
const MAX_FILE_MB = 10;

@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedExtensions = [
          '.pdf',
          '.doc',
          '.docx',
          '.xls',
          '.xlsx',
          '.ppt',
          '.pptx',
          '.txt',
          '.png',
          '.jpg',
          '.jpeg',
        ];
        const ext = extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('Định dạng tệp không được hỗ trợ.'),
            false,
          );
        }
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Không tìm thấy tệp tải lên.');
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'Thiếu cấu hình Cloudinary để tải tệp lên cloud.',
      );
    }

    const params: Record<string, string> = {
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'course-documents',
      timestamp: Math.floor(Date.now() / 1000).toString(),
    };
    const extension = extname(file.originalname).toLowerCase();
    const isRaw = !INLINE_EXTENSIONS.includes(extension);
    if (isRaw) params.public_id = `${crypto.randomUUID()}${extension}`;

    const signaturePayload = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    const signature = crypto
      .createHash('sha1')
      .update(`${signaturePayload}${apiSecret}`)
      .digest('hex');

    const formData = new FormData();
    formData.append(
      'file',
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
    );
    for (const [key, value] of Object.entries(params)) {
      formData.append(key, value);
    }
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${isRaw ? 'raw' : 'auto'}/upload`,
      {
        method: 'POST',
        body: formData,
      },
    );

    if (!response.ok) {
      throw new InternalServerErrorException('Tải tệp lên cloud thất bại.');
    }

    const uploaded = (await response.json()) as { secure_url: string };

    return {
      name: file.originalname,
      url: uploaded.secure_url,
      size: file.size,
      type: file.mimetype,
    };
  }
}
