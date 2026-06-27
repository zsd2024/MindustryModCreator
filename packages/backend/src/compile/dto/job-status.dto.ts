import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class JobStatusDto {
  @ApiProperty({ description: '任务 ID' })
  @IsString()
  id: string;

  @ApiProperty({ 
    description: '任务状态',
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
  @IsEnum(['pending', 'processing', 'completed', 'failed'])
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @ApiProperty({ description: '进度百分比 (0-100)' })
  @IsNumber()
  progress: number;

  @ApiPropertyOptional({ description: '编译结果' })
  @IsOptional()
  result?: {
    downloadUrl: string;
    fileSize: number;
  };

  @ApiPropertyOptional({ description: '错误信息' })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiProperty({ description: '创建时间' })
  @IsString()
  createdAt: string;

  @ApiProperty({ description: '更新时间' })
  @IsString()
  updatedAt: string;
}