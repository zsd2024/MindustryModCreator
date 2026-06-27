import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 启用 CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });
  
  // 设置全局前缀
  app.setGlobalPrefix('api/v1');
  
  // 配置 Swagger
  const config = new DocumentBuilder()
    .setTitle('Mindustry Mod Creator API')
    .setDescription('Mindustry-Scratch 在线图形化 Mod 编辑器后端 API')
    .setVersion('1.0')
    .addTag('compile', '编译相关接口')
    .addTag('projects', '项目管理接口')
    .addTag('jobs', '任务状态接口')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  // 启动服务器
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Mindustry Mod Creator 后端已启动: http://localhost:${port}`);
  console.log(`📚 API 文档: http://localhost:${port}/api`);
}

bootstrap();