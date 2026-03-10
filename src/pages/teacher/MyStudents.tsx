import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Student } from '../../types';
import { ArrowLeft, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MyStudents() {
  const { user } = useAuth();
  
  const { data: students, isLoading } = useQuery({
    queryKey: ['students', user?.id],
    queryFn: async () => {
      // 1. Get Teacher ID
      const { data: teacherData } = await supabase
        .from('teacher_accounts')
        .select('teacher_id')
        .eq('user_id', user!.id)
        .single();
      
      if (!teacherData) return [];

      // 2. Get assignments
      const { data: assignments } = await supabase
        .from('teacher_assignments')
        .select('class_id')
        .eq('teacher_id', teacherData.teacher_id);
      
      if (!assignments) return [];

      const classIds = assignments.map(a => a.class_id);

      const { data, error } = await supabase
        .from('students')
        .select('id, name, national_id, class_id')
        .in('class_id', classIds);
      
      if (error) throw error;
      return data as Student[];
    },
    enabled: !!user,
  });

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-8 w-48 skeleton" />
      <div className="h-64 skeleton rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/teacher"
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">My Students</h2>
          <p className="text-gray-500 text-sm">Students assigned to your classes</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="px-4">Name</th>
                <th className="px-4">National ID</th>
              </tr>
            </thead>
            <tbody>
              {students?.map(student => (
                <tr key={student.id} className="border-t border-gray-100">
                  <td className="px-4 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    {student.name}
                  </td>
                  <td className="px-4 text-gray-600">{student.national_id}</td>
                </tr>
              ))}
              {(!students || students.length === 0) && (
                <tr>
                  <td colSpan={2} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="text-gray-500">No students assigned yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
