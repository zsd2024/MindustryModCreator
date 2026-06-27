import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DirectoryBuilderService {
  private readonly logger = new Logger(DirectoryBuilderService.name);

  async buildDirectory(manifest: any): Promise<string> {
    const buildId = uuidv4();
    const buildDir = path.join(os.tmpdir(), 'mindustry-mod-build', buildId);
    
    this.logger.log(`创建构建目录: ${buildDir}`);
    
    // 创建目录结构
    await fs.mkdir(buildDir, { recursive: true });
    await fs.mkdir(path.join(buildDir, 'content'), { recursive: true });
    await fs.mkdir(path.join(buildDir, 'content', 'blocks'), { recursive: true });
    await fs.mkdir(path.join(buildDir, 'content', 'items'), { recursive: true });
    await fs.mkdir(path.join(buildDir, 'content', 'units'), { recursive: true });
    await fs.mkdir(path.join(buildDir, 'content', 'liquids'), { recursive: true });
    await fs.mkdir(path.join(buildDir, 'content', 'blocks', 'icons'), { recursive: true });
    await fs.mkdir(path.join(buildDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(buildDir, 'src', 'com', 'mymod'), { recursive: true });
    await fs.mkdir(path.join(buildDir, 'src', 'com', 'mymod', 'content', 'blocks'), { recursive: true });
    
    // 生成 mod.json
    const modJson = this.generateModJson(manifest.modMeta);
    await fs.writeFile(
      path.join(buildDir, 'mod.json'),
      JSON.stringify(modJson, null, 2),
    );
    
    // 生成内容文件
    await this.generateContentFiles(manifest, buildDir);
    
    return buildDir;
  }

  private generateModJson(modMeta: any): any {
    return {
      name: modMeta.name,
      displayName: modMeta.displayName,
      author: modMeta.author,
      description: modMeta.description,
      version: modMeta.version,
      minGameVersion: modMeta.minGameVersion,
      hidden: false,
      java: true,
      dependencies: [],
    };
  }

  private async generateContentFiles(manifest: any, buildDir: string): Promise<void> {
    const { nodes } = manifest.assetTree;
    
    for (const [id, node] of Object.entries(nodes)) {
      if ((node as any).type !== 'content') continue;
      
      const content = node as any;
      const contentType = content.contentType;
      const name = content.name;
      
      // 根据内容类型确定目录
      let contentDir: string;
      switch (contentType) {
        case 'block':
          contentDir = path.join(buildDir, 'content', 'blocks');
          break;
        case 'item':
          contentDir = path.join(buildDir, 'content', 'items');
          break;
        case 'unit':
          contentDir = path.join(buildDir, 'content', 'units');
          break;
        case 'liquid':
          contentDir = path.join(buildDir, 'content', 'liquids');
          break;
        default:
          this.logger.warn(`未知内容类型: ${contentType}，跳过节点 ${id}`);
          continue;
      }
      
      // 生成 HJSON 文件
      if (content.hjsonSchema) {
        const hjsonContent = this.convertToHjson(content.hjsonSchema, name);
        const filePath = path.join(contentDir, `${name}.hjson`);
        await fs.writeFile(filePath, hjsonContent);
        this.logger.log(`生成 HJSON 文件: ${filePath}`);
      }
      
      // 生成图标文件
      if (content.iconBase64) {
        const iconBuffer = Buffer.from(content.iconBase64, 'base64');
        const iconPath = path.join(buildDir, 'content', 'blocks', 'icons', `${name}.png`);
        await fs.writeFile(iconPath, iconBuffer);
        this.logger.log(`生成图标文件: ${iconPath}`);
      }
    }
  }

  private convertToHjson(schema: any, name: string): string {
    // 简单的 HJSON 生成，实际应该使用 hjson-js 库
    const lines: string[] = [];
    lines.push(`name: ${name}`);
    
    for (const [key, value] of Object.entries(schema)) {
      if (key === 'name') continue; // 已经添加了
      
      if (typeof value === 'string') {
        lines.push(`${key}: ${value}`);
      } else if (typeof value === 'number') {
        lines.push(`${key}: ${value}`);
      } else if (typeof value === 'boolean') {
        lines.push(`${key}: ${value}`);
      } else if (Array.isArray(value)) {
        lines.push(`${key}: ${JSON.stringify(value)}`);
      } else if (typeof value === 'object' && value !== null) {
        lines.push(`${key}: ${JSON.stringify(value)}`);
      }
    }
    
    return lines.join('\n') + '\n';
  }

  async cleanup(buildDir: string): Promise<void> {
    try {
      this.logger.log(`清理构建目录: ${buildDir}`);
      await fs.rm(buildDir, { recursive: true, force: true });
    } catch (error) {
      this.logger.error(`清理构建目录失败: ${buildDir}`, error.stack);
    }
  }
}