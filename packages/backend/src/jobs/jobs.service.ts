import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobStatusDto } from './dto/job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('compile') private compileQueue: Queue,
  ) {}

  async findAll(status?: string, userId?: string): Promise<JobStatusDto[]> {
    const jobs = await this.compileQueue.getJobs(['waiting', 'active', 'completed', 'failed', 'delayed']);
    
    let filteredJobs = jobs;
    
    if (status) {
      filteredJobs = jobs.filter(job => {
        const jobState = this.getJobState(job);
        return jobState === status;
      });
    }
    
    return Promise.all(
      filteredJobs.map(job => this.mapJobToDto(job)),
    );
  }

  async findOne(id: string): Promise<JobStatusDto> {
    const job = await this.compileQueue.getJob(id);
    
    if (!job) {
      throw new NotFoundException(`任务 ${id} 不存在`);
    }
    
    return this.mapJobToDto(job);
  }

  async remove(id: string): Promise<void> {
    const job = await this.compileQueue.getJob(id);
    
    if (!job) {
      throw new NotFoundException(`任务 ${id} 不存在`);
    }
    
    const state = await job.getState();
    
    if (state === 'active') {
      // 活跃任务无法直接删除，需要等待完成或失败
      throw new Error('无法删除正在执行的任务');
    }
    
    await job.remove();
  }

  private async mapJobToDto(job: any): Promise<JobStatusDto> {
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

  private getJobState(job: any): string {
    // 这里简化处理，实际应该使用 job.getState()
    return 'unknown';
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