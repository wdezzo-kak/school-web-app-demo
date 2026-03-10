# Supabase MCP Tools

## Overview
MCP (Model Context Protocol) tools that agents can use to interact with Supabase services.

## Tools

### supabase_sql

Execute SQL queries against the PostgreSQL database.

```typescript
interface supabase_sql {
  query: string;
  params?: any[];
}
```

**Usage:**
- Create tables
- Run migrations
- Query data
- Create indexes

**Best Practice - Always Enable RLS:**
```typescript
await supabase_sql({
  query: `
    CREATE TABLE students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      national_id TEXT UNIQUE NOT NULL,
      class_id UUID REFERENCES classes(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Enable RLS immediately
    ALTER TABLE students ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "students_select" ON students
      FOR SELECT TO authenticated
      USING (true);
  `
});
```

**Best Practice - Index Foreign Keys:**
```typescript
await supabase_sql({
  query: `
    CREATE INDEX idx_skills_student_id ON skills(student_id);
    CREATE INDEX idx_skills_teacher_id ON skills(teacher_id);
    CREATE INDEX idx_attendance_student_id ON attendance(student_id);
    CREATE INDEX idx_attendance_date ON attendance(date);
  `
});
```

---

### supabase_migrations

Create and manage database migrations.

```typescript
interface supabase_migrations {
  name: string;
  sql: string;
}
```

**Usage:**
- Version control schema changes
- Rollback migrations
- Apply pending migrations

**Best Practice - Migration Structure:**
```typescript
await supabase_migrations({
  name: "001_create_students_with_rls",
  sql: `
    -- Create table
    CREATE TABLE IF NOT EXISTS students (...);
    
    -- Enable RLS
    ALTER TABLE students ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY ...;
    
    -- Create indexes
    CREATE INDEX ...;
  `
});
```

---

### supabase_storage

Manage file storage in Supabase Storage buckets.

```typescript
interface supabase_storage {
  operation: "upload" | "download" | "delete" | "list";
  bucket: string;
  path: string;
  file?: File;
}
```

**Best Practice - Bucket with Policies:**
```typescript
// Create bucket
await supabase_sql({
  query: `
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('media', 'media', true);
  `
});

// Set policies
await supabase_sql({
  query: `
    CREATE POLICY "Public can view media"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'media');
      
    CREATE POLICY "Users can upload media"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'media');
  `
});
```

---

### supabase_auth

Manage authentication operations.

```typescript
interface supabase_auth {
  operation: "sign_up" | "sign_in" | "sign_out" | "get_user" | "update_metadata";
  email?: string;
  password?: string;
  metadata?: Record<string, any>;
}
```

**Best Practice - Create Profile on Signup:**
```typescript
// Use Supabase Auth Hook or Edge Function
await supabase_sql({
  query: `
    CREATE OR REPLACE FUNCTION handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.profiles (id, name, role)
      VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'parent')
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  `
});
```

---

### supabase_edge_functions

Deploy and manage Edge Functions.

```typescript
interface supabase_edge_functions {
  operation: "deploy" | "invoke" | "list" | "delete";
  name: string;
  code?: string;
  params?: Record<string, any>;
}
```

**Best Practice - Structure:**
```typescript
await supabase_edge_functions({
  operation: "deploy",
  name: "process-image",
  code: `
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
    import sharp from 'https://esm.sh/sharp@0.33.2'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    Deno.serve(async (req) => {
      // Handle CORS
      if (req.method === 'OPTIONS') {
        return new Response('ok', {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          },
        })
      }

      try {
        // Your logic here
        return new Response(JSON.stringify({ success: true }))
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      }
    })
  `
});
```

---

## Configuration

### Required Environment Variables

```env
# Frontend (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Backend/Edge Functions (.env.local)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Best Practices (2025-2026)

1. **Security**
   - Use service role key only in server-side code
   - Never expose service role key in frontend
   - Enable RLS on ALL tables
   - Use parameterized queries

2. **RLS**
   - Enable RLS immediately after table creation
   - Create policies for ALL operations (SELECT, INSERT, UPDATE, DELETE)
   - Use (SELECT auth.uid()) wrapper

3. **Edge Functions**
   - Use Deno 2.1+ features
   - Pin dependencies (npm:package@version)
   - Handle CORS properly
   - Validate all inputs

4. **Storage**
   - Create buckets with public access if needed
   - Set storage policies for access control
   - Use unique filenames (UUID)

5. **Database**
   - Use UUIDs for primary keys
   - Index foreign keys
   - Never use SELECT *
   - Use LIMIT for pagination
