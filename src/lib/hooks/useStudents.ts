import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Student } from '../../types';

export const useTeacherStudents = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacher-students', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: assignments, error: assignmentError } = await supabase
        .from('teacher_assignments')
        .select('class_id')
        .eq('teacher_id', user.id);

      if (assignmentError) throw assignmentError;
      if (!assignments || assignments.length === 0) return [];

      const classIds = assignments.map(a => a.class_id);

      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          name,
          national_id,
          class_id,
          classes(name)
        `)
        .in('class_id', classIds);

      if (error) throw error;
      return data as unknown as (Student & { classes: { name: string } })[];
    },
    enabled: !!user,
  });
};
