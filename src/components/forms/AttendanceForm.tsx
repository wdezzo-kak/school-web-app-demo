import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  students: { id: string; name: string }[];
  date: string;
  onSuccess: () => void;
}

export default function AttendanceForm({ students, date, onSuccess }: Props) {
  const { user } = useAuth();
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data: any) => {
    const { data: teacherData } = await supabase
      .from('teacher_accounts')
      .select('teacher_id')
      .eq('user_id', user!.id)
      .single();

    if (!teacherData) return;

    const attendanceRecords = students.map(student => ({
      student_id: student.id,
      teacher_id: teacherData.teacher_id,
      status: data[student.id],
      date: date,
    }));

    const { error } = await supabase.from('attendance').insert(attendanceRecords);
    if (error) {
      console.error('Error recording attendance:', error);
      return;
    }

    // Create notifications for absent students
    const absentStudents = students.filter(s => data[s.id] === 'absent');
    for (const student of absentStudents) {
      const { data: parentLinks } = await supabase
        .from('parent_students')
        .select('parent_user_id')
        .eq('student_id', student.id);

if (parentLinks && parentLinks.length > 0) {
        const notifications = parentLinks.map(p => ({
          student_id: student.id,
          user_id: p.parent_user_id,
          title: 'Student Absent',
          message: `Your child was marked absent on ${date}.`,
        }));
        const { error: notifError } = await supabase.from('notifications').insert(notifications);
        if (notifError) {
          console.error('Error creating notification:', notifError);
        }
      }
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded bg-white">
      <h3 className="font-bold">Attendance for {date}</h3>
      {students.map(student => (
        <div key={student.id} className="flex items-center justify-between">
          <span>{student.name}</span>
          <select {...register(student.id)} className="border p-1 rounded">
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
        </div>
      ))}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save Attendance</button>
    </form>
  );
}
