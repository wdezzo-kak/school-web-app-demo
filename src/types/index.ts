export type UserRole = 'admin' | 'teacher' | 'parent'

export interface Profile {
  id: string
  name: string
  role: UserRole
  created_at: string
}

export interface Student {
  id: string
  name: string
  national_id: string
  class_id: string
  created_at: string
  classes?: {
    name: string
    grade: string
  }
}

export interface Teacher {
  id: string
  name: string
  email: string
  national_id: string
  created_at: string
}

export interface Class {
  id: string
  name: string
  grade: string
  created_at: string
}

export interface Subject {
  id: string
  name: string
  created_at: string
}

export interface TeacherAssignment {
  teacher_id: string
  class_id: string
  subject_id: string
  created_at: string
  teachers?: Teacher
  classes?: Class
  subjects?: Subject
}

export interface Skill {
  id: string
  student_id: string
  teacher_id: string
  skill_name: string
  note: string | null
  image_url: string | null
  created_at: string
}

export interface Behavior {
  id: string
  student_id: string
  teacher_id: string
  type: 'positive' | 'negative'
  note: string | null
  created_at: string
}

export interface Attendance {
  id: string
  student_id: string
  teacher_id: string
  status: 'present' | 'absent' | 'late'
  date: string
  created_at: string
}

export interface Notification {
  id: string
  student_id: string
  user_id: string
  title: string
  message: string | null
  is_read: boolean
  created_at: string
}

export interface ParentStudent {
  parent_user_id: string
  student_id: string
  relationship: 'father' | 'mother' | 'guardian'
  created_at: string
}
