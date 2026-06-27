import { Controller, Get, Delete, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JobStatusDto } from './dto/job.dto';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: '获取任务列表' })
  @ApiQuery({ name: 'status', required: false, description: '任务状态过滤' })
  @ApiQuery({ name: 'userId', required: false, description: '用户 ID' })
  @ApiResponse({ status: 200, description: '任务列表', type: [JobStatusDto] })
  async findAll(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ): Promise<JobStatusDto[]> {
    return this.jobsService.findAll(status, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取任务详情' })
  @ApiParam({ name: 'id', description: '任务 ID' })
  @ApiResponse({ status: 200, description: '任务详情', type: JobStatusDto })
  @ApiResponse({ status: 404, description: '任务不存在' })
  async findOne(@Param('id') id: string): Promise<JobStatusDto> {
    return this.jobsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '取消任务' })
  @ApiParam({ name: 'id', description: '任务 ID' })
  @ApiResponse({ status: 204, description: '任务取消成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.jobsService.remove(id);
  }
}