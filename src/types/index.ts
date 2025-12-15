export type UserRole = 'client' | 'employee' | 'manager' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  companyId?: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface File {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  projectId: string;
  taskId?: string;
  uploadedBy: string;
  status: FileStatus;
  version: number;
  createdAt: Date;
}

export type FileStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  taskId?: string;
  fileId?: string;
  isInternal: boolean;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}
