/*
  # Admin Kullanıcı Oluşturma

  Bu migration, sistemin başlangıç admin kullanıcısını oluşturur.
  - Email: uzay@piruslab.com
  - Şifre: uzay123
  - Yetki: team_leader
*/

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
      email,
      email_confirmed_at,
      role,
      encrypted_password
    ) VALUES (
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