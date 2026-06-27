import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto, UpdateProjectDto, ProjectResponseDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
    const project = this.projectRepository.create(createProjectDto);
    const savedProject = await this.projectRepository.save(project);
    return this.mapToResponseDto(savedProject);
  }

  async findAll(userId?: string): Promise<ProjectResponseDto[]> {
    const where = userId ? { userId } : {};
    const projects = await this.projectRepository.find({
      where,
      order: { updatedAt: 'DESC' },
    });
    return projects.map(project => this.mapToResponseDto(project));
  }

  async findOne(id: string): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`项目 ${id} 不存在`);
    }
    return this.mapToResponseDto(project);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`项目 ${id} 不存在`);
    }
    
    Object.assign(project, updateProjectDto);
    const updatedProject = await this.projectRepository.save(project);
    return this.mapToResponseDto(updatedProject);
  }

  async remove(id: string): Promise<void> {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`项目 ${id} 不存在`);
    }
    
    await this.projectRepository.remove(project);
  }

  private mapToResponseDto(project: Project): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      displayName: project.displayName,
      description: project.description,
      userId: project.userId,
      manifest: project.manifest,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}