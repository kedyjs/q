export type UserType = 'team_member' | 'team_leader';

export type UserRole = 'Frontend' | 'Backend' | 'QA' | 'DevOps' | 'UI/UX' | 'Yönetici';

export type TaskStatus = 'Yapılacak' | 'Devam Ediyor' | 'Tamamlandı';

export type TaskPriority = 'Düşük' | 'Orta' | 'Yüksek' | 'Acil';

export interface User {
  id: string;
  email?: string;
  full_name: string;
  role: string;
  user_type: UserType;
  avatar_url?: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  assignee?: User;
  creator?: User;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface Role {
  id: string;
  name: string;
  created_at: string;
}