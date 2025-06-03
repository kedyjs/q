/*
  # Initial Schema Setup

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `full_name` (text)
      - `role` (text)
      - `user_type` (text)
      - `avatar_url` (text, nullable)
      - `created_at` (timestamp with time zone)
    
    - `tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `status` (text)
      - `priority` (text)
      - `due_date` (timestamp with time zone)
      - `assigned_to` (uuid, foreign key to profiles)
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
    
    - `comments`
      - `id` (uuid, primary key)
      - `task_id` (uuid, foreign key to tasks)
      - `user_id` (uuid, foreign key to profiles)
      - `content` (text)
      - `created_at` (timestamp with time zone)
    
    - `roles`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Profiles tablosu
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL,
  role text NOT NULL,
  user_type text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT profiles_user_type_check CHECK (user_type IN ('team_member', 'team_leader'))
);

-- Tasks tablosu
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Yapılacak',
  priority text NOT NULL DEFAULT 'Orta',
  due_date timestamptz,
  assigned_to uuid REFERENCES profiles(id),
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT tasks_status_check CHECK (status IN ('Yapılacak', 'Devam Ediyor', 'Tamamlandı')),
  CONSTRAINT tasks_priority_check CHECK (priority IN ('Düşük', 'Orta', 'Yüksek', 'Acil'))
);

-- Comments tablosu
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Roles tablosu
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- RLS ve politikalar
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Profiles politikaları
CREATE POLICY "Kullanıcı profili görüntüleme" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Kullanıcılar kendi profillerini düzenleyebilir" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Team leader kullanıcı profili oluşturabilir" ON profiles
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'team_leader'
    )
  );

-- Tasks politikaları
CREATE POLICY "Herkes tüm görevleri görebilir" ON tasks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team leader yeni görev oluşturabilir" ON tasks
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'team_leader'
    )
  );

CREATE POLICY "Team member kendi görevlerini düzenleyebilir" ON tasks
  FOR UPDATE TO authenticated USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'team_leader'
    )
  );

CREATE POLICY "Team leader görev silebilir" ON tasks
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'team_leader'
    )
  );

-- Comments politikaları
CREATE POLICY "Herkes yorumları görebilir" ON comments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Kullanıcılar yorum ekleyebilir" ON comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi yorumlarını düzenleyebilir" ON comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi yorumlarını silebilir" ON comments
  FOR DELETE TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'team_leader'
    )
  );

-- Roles politikaları
CREATE POLICY "Herkes rolleri görebilir" ON roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Team leader rol ekleyebilir" ON roles
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'team_leader'
    )
  );

CREATE POLICY "Team leader rolleri düzenleyebilir" ON roles
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'team_leader'
    )
  );

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_task_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'task_changes',
    json_build_object(
      'type', TG_OP,
      'task_id', NEW.id,
      'title', NEW.title,
      'status', NEW.status,
      'assigned_to', NEW.assigned_to
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggerlar
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER task_changed
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_changes();

-- Admin kullanıcısını oluştur
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Admin kullanıcısını kontrol et, yoksa oluştur
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'uzay@piruslab.com'
  ) THEN
    -- Kullanıcıyı auth.users tablosuna ekle
    INSERT INTO auth.users (
      id,
      email,
      email_confirmed_at,
      role,
      encrypted_password
    ) VALUES (
      gen_random_uuid(),
      'uzay@piruslab.com',
      now(),
      'authenticated',
      crypt('uzay123', gen_salt('bf'))
    )
    RETURNING id INTO admin_id;

    -- Admin profilini profiles tablosuna ekle
    INSERT INTO profiles (
      id,
      full_name,
      role,
      user_type
    ) VALUES (
      admin_id,
      'Uzay Admin',
      'Yönetici',
      'team_leader'
    );
  END IF;
END
$$;