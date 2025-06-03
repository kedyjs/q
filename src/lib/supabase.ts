import { createClient } from '@supabase/supabase-js';
import { User, Task, Comment } from '../types';

// Supabase konfigürasyonu
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Supabase istemcisini oluştur
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Kimlik doğrulama işlemleri
export const auth = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    return { data, error };
  },
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    return { data, error };
  }
};

// Kullanıcı işlemleri
export const users = {
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },
  getCurrentProfile: async () => {
    const { data: authData } = await auth.getUser();
    if (!authData?.user) return { data: null, error: new Error('Kullanıcı bulunamadı') };
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    return { data, error };
  },
  getAllProfiles: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');
    return { data, error };
  },
  createProfile: async (profile: Omit<User, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.auth.admin.createUser({
      email: profile.email!,
      password: 'geciciSifre123', // Geçici şifre, kullanıcının değiştirmesi gerekecek
      email_confirm: true,
      user_metadata: { full_name: profile.full_name }
    });
    
    if (error || !data.user) return { data: null, error: error || new Error('Kullanıcı oluşturulamadı') };
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          full_name: profile.full_name,
          role: profile.role,
          user_type: profile.user_type,
          avatar_url: profile.avatar_url
        }
      ])
      .select()
      .single();
      
    return { data: profileData, error: profileError };
  },
  updateProfile: async (userId: string, updates: Partial<User>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },
  getRoles: async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');
    return { data, error };
  }
};

// Görev işlemleri
export const tasks = {
  getTasks: async (filters: { status?: string; priority?: string; assignedTo?: string } = {}) => {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(id, full_name, role, user_type, avatar_url),
        creator:profiles!tasks_created_by_fkey(id, full_name)
      `)
      .order('due_date', { ascending: true, nullsLast: true });
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    
    const { data, error } = await query;
    return { data, error };
  },
  getTask: async (taskId: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assigned_to_fkey(id, full_name, role, user_type, avatar_url),
        creator:profiles!tasks_created_by_fkey(id, full_name)
      `)
      .eq('id', taskId)
      .single();
    return { data, error };
  },
  createTask: async (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'assignee' | 'creator'>) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single();
    return { data, error };
  },
  updateTask: async (taskId: string, updates: Partial<Task>) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    
    // Discord webhook'a bildirim gönderme
    if (data && !error) {
      await sendWebhookNotification({
        type: 'task_update',
        task: data
      });
    }
    
    return { data, error };
  },
  deleteTask: async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    return { error };
  },
  getComments: async (taskId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles(id, full_name, avatar_url)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    return { data, error };
  },
  addComment: async (comment: Omit<Comment, 'id' | 'created_at' | 'user'>) => {
    const { data, error } = await supabase
      .from('comments')
      .insert([comment])
      .select(`
        *,
        user:profiles(id, full_name, avatar_url)
      `)
      .single();
    return { data, error };
  },
  deleteComment: async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
    return { error };
  }
};

// Discord webhook bildirimleri
export const sendWebhookNotification = async (payload: {
  type: 'task_create' | 'task_update' | 'task_assign';
  task: Task;
  message?: string;
}) => {
  // Edge fonksiyonu yerine frontend tarafında işlem yapıyoruz
  // Gerçek uygulamada bu işlem Edge Function ile yapılmalı
  const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;
  
  try {
    const { data: taskData } = await tasks.getTask(payload.task.id);
    if (!taskData) return;
    
    let content = '';
    const taskUrl = `${window.location.origin}/tasks/${taskData.id}`;
    
    if (payload.type === 'task_create') {
      content = `🆕 Yeni görev oluşturuldu: **${taskData.title}**\n${taskUrl}`;
    } else if (payload.type === 'task_update') {
      content = `🔄 Görev güncellendi: **${taskData.title}**\n${taskUrl}`;
    } else if (payload.type === 'task_assign') {
      const assigneeName = taskData.assignee?.full_name || 'Bilinmeyen Kullanıcı';
      content = `📌 Görev atandı: **${taskData.title}** -> ${assigneeName}\n${taskUrl}`;
    }
    
    // Discord Webhook'a gönderme (gerçek uygulamada Edge Function'da yapılmalı)
    if (content) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
    }
  } catch (error) {
    console.error('Webhook bildirimi gönderilemedi:', error);
  }
};