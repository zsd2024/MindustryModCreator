import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class CompileRequestDto {
  @ApiProperty({ description: 'ModManifest 清单数据' })
  @IsObject()
  manifest: any;

  @ApiPropertyOptional({ description: '用户 ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: '项目 ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: '编译优先级', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  priority?: number;
}

export class CompileResponseDto {
  @ApiProperty({ description: '是否成功提交' })
  success: boolean;

  @ApiProperty({ description: '任务 ID' })
  jobId: string;

  @ApiProperty({ description: '提示信息' })
  message: string;
}