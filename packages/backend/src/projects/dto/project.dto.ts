import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ description: '项目名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '显示名称' })
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ description: '项目描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '用户 ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'ModManifest 清单数据' })
  @IsObject()
  manifest: any;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ description: '项目名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '显示名称' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ description: '项目描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'ModManifest 清单数据' })
  @IsOptional()
  @IsObject()
  manifest?: any;
}

export class ProjectResponseDto {
  @ApiProperty({ description: '项目 ID' })
  id: string;

  @ApiProperty({ description: '项目名称' })
  name: string;

  @ApiProperty({ description: '显示名称' })
  displayName: string;

  @ApiPropertyOptional({ description: '项目描述' })
  description?: string;

  @ApiPropertyOptional({ description: '用户 ID' })
  userId?: string;

  @ApiProperty({ description: 'ModManifest 清单数据' })
  manifest: any;

  @ApiProperty({ description: '创建时间' })
  createdAt: string;

  @ApiProperty({ description: '更新时间' })
  updatedAt: string;
}