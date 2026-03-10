import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import AttendanceForm from '../../components/forms/AttendanceForm';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AttendancePage() {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: students } = useQuery({
    queryKey: ['students', user?.id],
    queryFn: async () => {
      const { data: teacherData } = await supabase
        .from('teacher_accounts')
        .select('teacher_id')
        .eq('user_id', user!.id)
        .single();
      if (!teacherData) return [];

      const { data: assignments } = await supabase
        .from('teacher_assignments')
        .select('class_id')
        .eq('teacher_id', teacherData.teacher_id);
      
      if (!assignments || assignments.length === 0) return [];
      const classIds = assignments.map(a => a.class_id);

      const { data } = await supabase
        .from('students')
        .select('id, name')
        .in('class_id', classIds);
      return data || [];
    },
    enabled: !!user,
  });

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
          <h2 className="text-2xl font-bold">Attendance</h2>
          <p className="text-gray-500 text-sm">Record daily attendance for your students</p>
        </div>
      </div>

      {/* Date Picker */}
      <div className="card">
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Select Date
        </label>
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          className="input"
        />
      </div>

      {/* Attendance Form */}
      {students && (
        <AttendanceForm 
          students={students} 
          date={date} 
          onSuccess={() => {}} 
        />
      )}
    </div>
  );
}
