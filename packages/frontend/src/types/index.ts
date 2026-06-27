export interface AssetNode {
  id: string;
  type: 'folder' | 'content';
  name: string;
  parentId: string | null;
  order: number;
  
  // 仅当 type === 'content' 时存在
  contentType?: 'item' | 'block' | 'unit' | 'liquid';
  vmTargetId?: string;
  editorMode: 'hjson' | 'java';
  
  // 数据载荷
  hjsonSchema: Record<string, any>;
  javaBlocks: any;
  hasCustomLogic: boolean;
}

export type EditorMode = 'hjson' | 'java';

export interface HjsonSchema {
  [key: string]: any;
}

export interface ProjectMeta {
  name: string;
  displayName: string;
  author: string;
  description: string;
  version: string;
  minGameVersion: string;
}

export interface ModManifest {
  modMeta: ProjectMeta;
  globalLogic: string;
  assetTree: {
    nodes: Record<string, AssetNode>;
  };
}

export interface CompileRequest {
  manifest: ModManifest;
}

export interface CompileResponse {
  success: boolean;
  jobId: string;
  message: string;
}

export interface JobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: {
    downloadUrl: string;
    fileSize: number;
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}