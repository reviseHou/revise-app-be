import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @Length(1, 1000)
  refreshToken: string;
}
