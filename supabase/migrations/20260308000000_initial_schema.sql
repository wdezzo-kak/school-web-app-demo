-- Create Enum Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE behavior_type AS ENUM ('positive', 'negative');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. classes
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. subjects
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. teachers
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    national_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'parent',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. teacher_accounts
CREATE TABLE IF NOT EXISTS teacher_accounts (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. students
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    national_id TEXT UNIQUE NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. teacher_assignments
CREATE TABLE IF NOT EXISTS teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, class_id, subject_id)
);

-- 8. skills
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    skill_name TEXT NOT NULL,
    note TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. behaviors
CREATE TABLE IF NOT EXISTS behaviors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    type behavior_type NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. attendance
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    status attendance_status NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. parent_students
CREATE TABLE IF NOT EXISTS parent_students (
    parent_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    relationship TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (parent_user_id, student_id)
);

-- 12. notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_students_national_id ON students(national_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_teachers_national_id ON teachers(national_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_id ON teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_skills_student_id ON skills(student_id);
CREATE INDEX IF NOT EXISTS idx_behaviors_student_id ON behaviors(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_parent_students_student_id ON parent_students(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Admin Check Function
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins full access" ON profiles FOR ALL USING (is_admin());

-- Basic Tables (Read for all auth, Write for Admin)
CREATE POLICY "Authenticated users can view classes" ON classes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins full access to classes" ON classes FOR ALL USING (is_admin());

CREATE POLICY "Authenticated users can view subjects" ON subjects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins full access to subjects" ON subjects FOR ALL USING (is_admin());

CREATE POLICY "Authenticated users can view teachers" ON teachers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins full access to teachers" ON teachers FOR ALL USING (is_admin());

-- Teacher Accounts
CREATE POLICY "Admins full access to teacher_accounts" ON teacher_accounts FOR ALL USING (is_admin());
CREATE POLICY "Teachers can view own account link" ON teacher_accounts FOR SELECT USING (user_id = auth.uid());

-- Students
CREATE POLICY "Admins full access to students" ON students FOR ALL USING (is_admin());
CREATE POLICY "Teachers view assigned students" ON students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta
    JOIN teacher_accounts tacc ON ta.teacher_id = tacc.teacher_id
    WHERE tacc.user_id = auth.uid() AND ta.class_id = students.class_id
  )
);
CREATE POLICY "Parents view own children" ON students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM parent_students ps
    WHERE ps.parent_user_id = auth.uid() AND ps.student_id = students.id
  )
);

-- Teacher Assignments
CREATE POLICY "Admins full access to teacher_assignments" ON teacher_assignments FOR ALL USING (is_admin());
CREATE POLICY "Teachers view own assignments" ON teacher_assignments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teacher_accounts tacc
    WHERE tacc.user_id = auth.uid() AND tacc.teacher_id = teacher_assignments.teacher_id
  )
);

-- Skills
CREATE POLICY "Admins full access to skills" ON skills FOR ALL USING (is_admin());
CREATE POLICY "Teachers manage assigned students' skills" ON skills FOR ALL USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta
    JOIN teacher_accounts tacc ON ta.teacher_id = tacc.teacher_id
    JOIN students s ON s.class_id = ta.class_id
    WHERE tacc.user_id = auth.uid() AND s.id = skills.student_id
  )
);
CREATE POLICY "Parents view children's skills" ON skills FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM parent_students ps
    WHERE ps.parent_user_id = auth.uid() AND ps.student_id = skills.student_id
  )
);

-- Behaviors
CREATE POLICY "Admins full access to behaviors" ON behaviors FOR ALL USING (is_admin());
CREATE POLICY "Teachers manage assigned students' behaviors" ON behaviors FOR ALL USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta
    JOIN teacher_accounts tacc ON ta.teacher_id = tacc.teacher_id
    JOIN students s ON s.class_id = ta.class_id
    WHERE tacc.user_id = auth.uid() AND s.id = behaviors.student_id
  )
);
CREATE POLICY "Parents view children's behaviors" ON behaviors FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM parent_students ps
    WHERE ps.parent_user_id = auth.uid() AND ps.student_id = behaviors.student_id
  )
);

-- Attendance
CREATE POLICY "Admins full access to attendance" ON attendance FOR ALL USING (is_admin());
CREATE POLICY "Teachers manage assigned students' attendance" ON attendance FOR ALL USING (
  EXISTS (
    SELECT 1 FROM teacher_assignments ta
    JOIN teacher_accounts tacc ON ta.teacher_id = tacc.teacher_id
    JOIN students s ON s.class_id = ta.class_id
    WHERE tacc.user_id = auth.uid() AND s.id = attendance.student_id
  )
);
CREATE POLICY "Parents view children's attendance" ON attendance FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM parent_students ps
    WHERE ps.parent_user_id = auth.uid() AND ps.student_id = attendance.student_id
  )
);

-- Parent Students
CREATE POLICY "Admins full access to parent_students" ON parent_students FOR ALL USING (is_admin());
CREATE POLICY "Parents view own relationships" ON parent_students FOR SELECT USING (parent_user_id = auth.uid());

-- Notifications
CREATE POLICY "Admins full access to notifications" ON notifications FOR ALL USING (is_admin());
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL USING (user_id = auth.uid());

-- Handle New User Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email, 'User'),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'parent'::user_role)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup existing trigger if exists to avoid errors on multiple runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
