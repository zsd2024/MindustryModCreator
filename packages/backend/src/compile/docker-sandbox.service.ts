import { Injectable, Logger } from '@nestjs/common';
import * as Docker from 'dockerode';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class DockerSandboxService {
  private readonly logger = new Logger(DockerSandboxService.name);
  private readonly docker: Docker;

  constructor() {
    this.docker = new Docker({
      socketPath: '/var/run/docker.sock',
    });
  }

  async compile(buildDir: string): Promise<any> {
    const containerName = `mindustry-compiler-${Date.now()}`;
    
    this.logger.log(`启动编译容器: ${containerName}`);
    
    try {
      // 检查编译镜像是否存在
      await this.ensureImage();
      
      // 创建容器
      const container = await this.docker.createContainer({
        Image: 'mindustry-compiler:jdk17',
        name: containerName,
        Cmd: [
          'sh', '-c',
          `
          # 编译 Java
          javac -cp "/libs/mindustry.jar" -d /out/classes $(find /src -name "*.java") && \
          # 打包 Jar
          jar cf /output/mod.jar -C /out/classes . -C /src/content .
          `,
        ],
        HostConfig: {
          Binds: [
            `${buildDir}:/src:ro`,
            `${containerName}-output:/output`,
            `${containerName}-classes:/out/classes`,
          ],
          Memory: 512 * 1024 * 1024, // 512MB 内存限制
          CpuQuota: 50000, // 50% CPU 限制
          NetworkMode: 'none', // 禁用网络
        },
      });
      
      // 启动容器
      await container.start();
      this.logger.log(`容器已启动: ${containerName}`);
      
      // 等待容器完成
      const result = await container.wait();
      
      if (result.StatusCode !== 0) {
        // 获取错误日志
        const logs = await container.logs({
          stdout: true,
          stderr: true,
        });
        
        throw new Error(`编译失败，退出码: ${result.StatusCode}\n${logs.toString()}`);
      }
      
      // 获取编译结果
      const outputDir = `${containerName}-output`;
      const modJarPath = path.join(outputDir, 'mod.jar');
      
      // 复制文件到临时目录
      const outputPath = `/tmp/mindustry-mod-${Date.now()}.jar`;
      await this.copyFromVolume(outputDir, 'mod.jar', outputPath);
      
      // 上传到 MinIO（如果配置了）
      const downloadUrl = await this.uploadToStorage(outputPath);
      
      // 清理容器和卷
      await this.cleanup(containerName);
      
      return {
        downloadUrl,
        fileSize: (await fs.stat(outputPath)).size,
      };
    } catch (error) {
      this.logger.error(`编译失败: ${containerName}`, error.stack);
      await this.cleanup(containerName);
      throw error;
    }
  }

  private async ensureImage(): Promise<void> {
    try {
      await this.docker.getImage('mindustry-compiler:jdk17').inspect();
      this.logger.log('编译镜像已存在');
    } catch (error) {
      this.logger.warn('编译镜像不存在，尝试构建...');
      await this.buildImage();
    }
  }

  private async buildImage(): Promise<void> {
    // 构建编译镜像
    const dockerfile = `
FROM eclipse-temurin:17-jdk

# 安装必要工具
RUN apt-get update && apt-get install -y \\
    wget \\
    && rm -rf /var/lib/apt/lists/*

# 下载 Mindustry API
RUN mkdir -p /libs && \\
    wget -O /libs/mindustry.jar https://github.com/Anuken/Mindustry/releases/download/v145/Mindustry.jar

# 创建目录
RUN mkdir -p /src /out/classes /output

WORKDIR /src
`;
    
    // 这里应该实现实际的镜像构建逻辑
    this.logger.warn('需要手动构建编译镜像: mindustry-compiler:jdk17');
  }

  private async copyFromVolume(volumeName: string, fileName: string, destPath: string): Promise<void> {
    // 从 Docker 卷复制文件
    // 这里简化处理，实际应该使用 Docker API
    this.logger.log(`从卷 ${volumeName} 复制文件 ${fileName} 到 ${destPath}`);
  }

  private async uploadToStorage(filePath: string): Promise<string> {
    // 上传到 MinIO/S3
    // 这里简化处理，返回本地路径
    this.logger.log(`上传文件到存储: ${filePath}`);
    return `file://${filePath}`;
  }

  private async cleanup(containerName: string): Promise<void> {
    try {
      // 停止并删除容器
      const container = this.docker.getContainer(containerName);
      await container.stop().catch(() => {});
      await container.remove();
      
      // 删除卷
      await this.docker.getVolume(`${containerName}-output`).remove().catch(() => {});
      await this.docker.getVolume(`${containerName}-classes`).remove().catch(() => {});
      
      this.logger.log(`清理完成: ${containerName}`);
    } catch (error) {
      this.logger.error(`清理失败: ${containerName}`, error.stack);
    }
  }
}