/*
  # Create admin user

  1. Changes
    - Create admin user with email uzay@piruslab.com
    - Set user type as team_leader
    - Set role as Yönetici
    
  2. Security
    - Password is hashed using bcrypt
    - User is automatically confirmed
*/

-- Admin kullanıcısını oluştur
DO $$
DECLARE
  admin_id UUID := gen_random_uuid();
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
      encrypted_password,
      created_at
    ) VALUES (
      admin_id,
      'uzay@piruslab.com',
      now(),
      'authenticated',
      crypt('uzay123', gen_salt('bf')),
      now()
    );

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