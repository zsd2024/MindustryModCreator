import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CompileRequestDto, CompileResponseDto } from './dto/compile.dto';
import { JobStatusDto } from './dto/job-status.dto';

@Injectable()
export class CompileService {
  constructor(
    @InjectQueue('compile') private compileQueue: Queue,
  ) {}

  async submitCompileJob(request: CompileRequestDto): Promise<CompileResponseDto> {
    const job = await this.compileQueue.add('compile', {
      manifest: request.manifest,
      userId: request.userId,
      projectId: request.projectId,
    }, {
      priority: request.priority || 0,
    });

    return {
      success: true,
      jobId: job.id,
      message: '编译任务已提交，请稍后查询状态',
    };
  }

  async getJobStatus(jobId: string): Promise<JobStatusDto> {
    const job = await this.compileQueue.getJob(jobId);
    
    if (!job) {
      throw new NotFoundException(`任务 ${jobId} 不存在`);
    }

    const state = await job.getState();
    const progress = job.progress as number || 0;

    return {
      id: job.id,
      status: this.mapJobState(state),
      progress,
      result: job.returnvalue,
      error: job.failedReason,
      createdAt: new Date(job.timestamp).toISOString(),
      updatedAt: new Date(job.finishedOn || job.processedOn || job.timestamp).toISOString(),
    };
  }

  private mapJobState(state: string): 'pending' | 'processing' | 'completed' | 'failed' {
    switch (state) {
      case 'waiting':
      case 'delayed':
        return 'pending';
      case 'active':
        return 'processing';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      default:
        return 'pending';
    }
  }
}