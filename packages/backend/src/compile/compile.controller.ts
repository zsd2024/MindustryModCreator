import { Controller, Post, Body, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CompileService } from './compile.service';
import { CompileRequestDto, CompileResponseDto } from './dto/compile.dto';
import { JobStatusDto } from './dto/job-status.dto';

@ApiTags('compile')
@Controller('compile')
export class CompileController {
  constructor(private readonly compileService: CompileService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: '提交编译任务' })
  @ApiBody({ type: CompileRequestDto })
  @ApiResponse({ status: 202, description: '编译任务已接受', type: CompileResponseDto })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async submitCompile(@Body() request: CompileRequestDto): Promise<CompileResponseDto> {
    return this.compileService.submitCompileJob(request);
  }

  @Get('status/:jobId')
  @ApiOperation({ summary: '查询编译任务状态' })
  @ApiParam({ name: 'jobId', description: '任务 ID' })
  @ApiResponse({ status: 200, description: '任务状态', type: JobStatusDto })
  @ApiResponse({ status: 404, description: '任务不存在' })
  async getJobStatus(@Param('jobId') jobId: string): Promise<JobStatusDto> {
    return this.compileService.getJobStatus(jobId);
  }
}