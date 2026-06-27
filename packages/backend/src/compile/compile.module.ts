import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CompileController } from './compile.controller';
import { CompileService } from './compile.service';
import { CompileProcessor } from './compile.processor';
import { DirectoryBuilderService } from './directory-builder.service';
import { JavaTranspilerService } from './java-transpiler.service';
import { DockerSandboxService } from './docker-sandbox.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'compile',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
  ],
  controllers: [CompileController],
  providers: [
    CompileService,
    CompileProcessor,
    DirectoryBuilderService,
    JavaTranspilerService,
    DockerSandboxService,
  ],
  exports: [CompileService],
})
export class CompileModule {}