import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class JavaTranspilerService {
  private readonly logger = new Logger(JavaTranspilerService.name);

  async transpileAll(manifest: any, buildDir: string): Promise<void> {
    const { nodes } = manifest.assetTree;
    
    for (const [id, node] of Object.entries(nodes)) {
      if ((node as any).type !== 'content') continue;
      
      const content = node as any;
      
      // 只有当 hasCustomLogic 为 true 时才生成 Java 文件
      if (!content.hasCustomLogic || !content.javaBlocks) {
        continue;
      }
      
      this.logger.log(`转译 Java 代码: ${content.name}`);
      
      try {
        const javaCode = await this.transpileBlocks(content);
        const className = this.capitalizeFirst(content.name);
        const packageName = this.getPackageName(content.contentType);
        
        const javaFilePath = path.join(
          buildDir,
          'src',
          'com',
          'mymod',
          'content',
          'blocks',
          `${className}.java`,
        );
        
        await fs.writeFile(javaFilePath, javaCode);
        this.logger.log(`生成 Java 文件: ${javaFilePath}`);
      } catch (error) {
        this.logger.error(`转译 Java 代码失败: ${content.name}`, error.stack);
        throw error;
      }
    }
    
    // 生成主 Mod 类
    await this.generateMainModClass(manifest, buildDir);
  }

  private async transpileBlocks(content: any): Promise<string> {
    const className = this.capitalizeFirst(content.name);
    const parentClass = this.getParentClass(content.contentType, content.hjsonSchema);
    
    // 生成 Java 代码
    const lines: string[] = [];
    
    lines.push(`package com.mymod.content.blocks;`);
    lines.push('');
    lines.push(`import mindustry.world.blocks.defense.Wall;`);
    lines.push(`import mindustry.type.*;`);
    lines.push('');
    lines.push(`public class ${className} extends ${parentClass} {`);
    lines.push(`    public ${className}(String name) {`);
    lines.push(`        super(name);`);
    
    // 转译构造函数积木
    if (content.javaBlocks?.constructorBlocks) {
      const constructorCode = this.transpileBlockList(content.javaBlocks.constructorBlocks);
      lines.push(constructorCode);
    }
    
    lines.push(`    }`);
    lines.push('');
    
    // 转译更新方法积木
    if (content.javaBlocks?.updateBlocks) {
      lines.push(`    @Override`);
      lines.push(`    public void updateTile() {`);
      lines.push(`        super.updateTile();`);
      
      const updateCode = this.transpileBlockList(content.javaBlocks.updateBlocks);
      lines.push(updateCode);
      
      lines.push(`    }`);
    }
    
    lines.push('}');
    
    return lines.join('\n');
  }

  private transpileBlockList(blocks: any[]): string {
    // 简单的积木转译实现
    // 实际应该实现完整的 Scratch AST 到 Java 的转译
    const lines: string[] = [];
    
    for (const block of blocks) {
      switch (block.type) {
        case 'when_block_updates':
          lines.push(`        // ${block.comment || '当方块更新'}`);
          break;
        case 'get_health':
          lines.push(`        int health = this.health;`);
          break;
        case 'set_health':
          lines.push(`        this.health = ${block.value};`);
          break;
        case 'if_health_less_than':
          lines.push(`        if (this.health < ${block.value}) {`);
          lines.push(`            // 条件满足时执行`);
          lines.push(`        }`);
          break;
        default:
          lines.push(`        // 未知积木类型: ${block.type}`);
      }
    }
    
    return lines.join('\n');
  }

  private async generateMainModClass(manifest: any, buildDir: string): Promise<void> {
    const mainClass = `package com.mymod;

import mindustry.mod.Mod;

public class MyMod extends Mod {
    public MyMod() {
        super();
    }

    @Override
    public void loadContent() {
        // 加载内容
    }
}
`;
    
    const mainClassPath = path.join(buildDir, 'src', 'com', 'mymod', 'MyMod.java');
    await fs.writeFile(mainClassPath, mainClass);
    this.logger.log(`生成主 Mod 类: ${mainClassPath}`);
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private getPackageName(contentType: string): string {
    switch (contentType) {
      case 'block':
        return 'content.blocks';
      case 'item':
        return 'content.items';
      case 'unit':
        return 'content.units';
      case 'liquid':
        return 'content.liquids';
      default:
        return 'content';
    }
  }

  private getParentClass(contentType: string, hjsonSchema: any): string {
    // 根据内容类型和属性确定父类
    switch (contentType) {
      case 'block':
        if (hjsonSchema?.size > 1) {
          return 'Wall';
        }
        return 'Wall';
      case 'item':
        return 'Item';
      case 'unit':
        return 'UnitType';
      case 'liquid':
        return 'Liquid';
      default:
        return 'Object';
    }
  }
}