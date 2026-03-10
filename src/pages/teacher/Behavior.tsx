import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import AddBehaviorForm from '../../components/forms/AddBehaviorForm';
import { ArrowLeft, ClipboardList, User, Smile, Frown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BehaviorPage() {
  const { user } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const { data: students, isLoading: loadingStudents } = useQuery({
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

  const { data: behaviors, refetch, isLoading: loadingBehaviors } = useQuery({
    queryKey: ['behaviors', selectedStudentId],
    queryFn: async () => {
      const { data } = await supabase
        .from('behaviors')
        .select('id, type, note, created_at')
        .eq('student_id', selectedStudentId!)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!selectedStudentId,
  });

  const selectedStudent = students?.find(s => s.id === selectedStudentId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 -mx-4 px-4 md:mx-0 md:px-0">
      {/* Header */}
      <div className="flex items-center gap-3 py-4">
        <Link
          to="/teacher"
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold truncate">Behavior</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Record & view behaviors</p>
        </div>
      </div>

      {/* Student Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student</label>
        <select 
          onChange={(e) => setSelectedStudentId(e.target.value || null)} 
          className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedStudentId || ''}
        >
          <option value="">Choose student...</option>
          {loadingStudents ? (
            <option>Loading...</option>
          ) : (
            students?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
          )}
        </select>
      </div>

      {/* Content */}
      {selectedStudentId ? (
        <div className="space-y-4">
          {/* Add Form Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Record Behavior</h3>
            <AddBehaviorForm studentId={selectedStudentId} onSuccess={refetch} />
          </div>

          {/* History Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">History</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{selectedStudent?.name}</span>
            </div>
            
            {loadingBehaviors ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : behaviors && behaviors.length > 0 ? (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto -mx-2 px-2">
                {behaviors.map(b => (
                  <div 
                    key={b.id} 
                    className={`p-3 rounded-lg border-l-4 ${
                      b.type === 'positive' 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                        : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {b.type === 'positive' ? (
                        <Smile className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Frown className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold text-sm ${
                          b.type === 'positive' 
                            ? 'text-green-700 dark:text-green-300' 
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          {b.type}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 break-words">
                          {b.note || '-'}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(b.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No behaviors recorded</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Select a student</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose above to record or view behaviors</p>
        </div>
      )}
    </div>
  );
}
