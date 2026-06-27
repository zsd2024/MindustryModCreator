import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto, ProjectResponseDto } from './dto/project.dto';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建新项目' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({ status: 201, description: '项目创建成功', type: ProjectResponseDto })
  async create(@Body() createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: '获取项目列表' })
  @ApiQuery({ name: 'userId', required: false, description: '用户 ID' })
  @ApiResponse({ status: 200, description: '项目列表', type: [ProjectResponseDto] })
  async findAll(@Query('userId') userId?: string): Promise<ProjectResponseDto[]> {
    return this.projectsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取项目详情' })
  @ApiParam({ name: 'id', description: '项目 ID' })
  @ApiResponse({ status: 200, description: '项目详情', type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: '项目不存在' })
  async findOne(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新项目' })
  @ApiParam({ name: 'id', description: '项目 ID' })
  @ApiBody({ type: UpdateProjectDto })
  @ApiResponse({ status: 200, description: '项目更新成功', type: ProjectResponseDto })
  @ApiResponse({ status: 404, description: '项目不存在' })
  async update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除项目' })
  @ApiParam({ name: 'id', description: '项目 ID' })
  @ApiResponse({ status: 204, description: '项目删除成功' })
  @ApiResponse({ status: 404, description: '项目不存在' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.projectsService.remove(id);
  }
}