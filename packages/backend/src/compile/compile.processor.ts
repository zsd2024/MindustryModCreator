import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DirectoryBuilderService } from './directory-builder.service';
import { JavaTranspilerService } from './java-transpiler.service';
import { DockerSandboxService } from './docker-sandbox.service';

interface CompileJobData {
  manifest: any;
  userId?: string;
  projectId?: string;
}

@Processor('compile')
export class CompileProcessor extends WorkerHost {
  private readonly logger = new Logger(CompileProcessor.name);

  constructor(
    private readonly directoryBuilder: DirectoryBuilderService,
    private readonly javaTranspiler: JavaTranspilerService,
    private readonly dockerSandbox: DockerSandboxService,
  ) {
    super();
  }

  async process(job: Job<CompileJobData>): Promise<any> {
    this.logger.log(`开始处理编译任务: ${job.id}`);
    
    try {
      // 更新进度：解析清单
      await job.updateProgress(10);
      this.logger.log('步骤 1/4: 解析 ModManifest');
      
      const { manifest } = job.data;
      
      // 更新进度：构建目录结构
      await job.updateProgress(30);
      this.logger.log('步骤 2/4: 构建目录结构');
      const buildDir = await this.directoryBuilder.buildDirectory(manifest);
      
      // 更新进度：转译 Java 代码
      await job.updateProgress(50);
      this.logger.log('步骤 3/4: 转译 Java 代码');
      await this.javaTranspiler.transpileAll(manifest, buildDir);
      
      // 更新进度：Docker 编译
      await job.updateProgress(70);
      this.logger.log('步骤 4/4: Docker 沙箱编译');
      const result = await this.dockerSandbox.compile(buildDir);
      
      // 清理临时目录
      await this.directoryBuilder.cleanup(buildDir);
      
      await job.updateProgress(100);
      this.logger.log(`编译任务完成: ${job.id}`);
      
      return result;
    } catch (error) {
      this.logger.error(`编译任务失败: ${job.id}`, error.stack);
      throw error;
    }
  }
}