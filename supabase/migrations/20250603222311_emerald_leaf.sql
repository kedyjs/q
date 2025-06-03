/*
  # Görev Yönetim Sistemi Şeması

  1. Tablolar
    - `profiles`: Kullanıcı profilleri
    - `tasks`: Görevler
    - `comments`: Görevlere ait yorumlar
    - `roles`: Kullanıcı rolleri

  2. Güvenlik
    - RLS tüm tablolar için etkinleştirildi
    - Her tablo için CRUD politikaları eklendi
*/

-- Profiller tablosu
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('team_member', 'team_leader')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcı profili görüntüleme"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Kullanıcılar kendi profillerini düzenleyebilir"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Team leader kullanıcı profili oluşturabilir"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'team_leader'
    )
  );

-- Görevler tablosu
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('Yapılacak', 'Devam Ediyor', 'Tamamlandı')) DEFAULT 'Yapılacak',
  priority TEXT NOT NULL CHECK (priority IN ('Düşük', 'Orta', 'Yüksek', 'Acil')) DEFAULT 'Orta',
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes tüm görevleri görebilir"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team member kendi görevlerini düzenleyebilir"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'team_leader'
    )
  );

CREATE POLICY "Team leader yeni görev oluşturabilir"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'team_leader'
    )
  );

CREATE POLICY "Team leader görev silebilir"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'team_leader'
    )
  );

-- Yorumlar tablosu
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes yorumları görebilir"
  ON comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Kullanıcılar yorum ekleyebilir"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi yorumlarını düzenleyebilir"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcılar kendi yorumlarını silebilir"
  ON comments
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'team_leader'
    )
  );

-- Roller tablosu (frontend, backend, QA, vb.)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes rolleri görebilir"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team leader rol ekleyebilir"
  ON roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'team_leader'
    )
  );

CREATE POLICY "Team leader rolleri düzenleyebilir"
  ON roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'team_leader'
    )
  );

-- Başlangıç rolleri ekleme
INSERT INTO roles (name) VALUES
  ('Frontend'),
  ('Backend'),
  ('QA'),
  ('DevOps'),
  ('UI/UX')
ON CONFLICT (name) DO NOTHING;

-- Tetikleyici fonksiyonu: güncelleme zamanını otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Discord webhook fonksiyonu
CREATE OR REPLACE FUNCTION notify_task_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Burada yapılacak işlemler için yer tutucu
  -- Discord webhook entegrasyonu için Edge Function kullanılacak
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_changed
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION notify_task_changes();