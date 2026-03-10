import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Smile, Frown, Send, Loader2 } from 'lucide-react';

const schema = z.object({
  type: z.enum(['positive', 'negative']),
  note: z.string().optional(),
});

interface Props {
  studentId: string;
  onSuccess: () => void;
}

export default function AddBehaviorForm({ studentId, onSuccess }: Props) {
  const { user } = useAuth();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'positive', note: '' }
  });

  const onSubmit = async (data: any) => {
    const { data: teacherData } = await supabase
      .from('teacher_accounts')
      .select('teacher_id')
      .eq('user_id', user!.id)
      .single();

    if (!teacherData) return;

    const { error } = await supabase.from('behaviors').insert({
      student_id: studentId,
      teacher_id: teacherData.teacher_id,
      type: data.type,
      note: data.note,
    });

    if (error) {
      console.error('Error adding behavior:', error);
      return;
    }

    // Create notifications
    const { data: parentLinks } = await supabase
      .from('parent_students')
      .select('parent_user_id')
      .eq('student_id', studentId);

    if (parentLinks && parentLinks.length > 0) {
      const behaviorType = data.type === 'positive' ? 'positive behavior' : 'negative behavior';
      const notifications = parentLinks.map(p => ({
        student_id: studentId,
        user_id: p.parent_user_id,
        title: data.type === 'positive' ? 'Positive Behavior Recorded' : 'Negative Behavior Recorded',
        message: `${behaviorType} was recorded: ${data.note || 'No note'}`,
      }));
      await supabase.from('notifications').insert(notifications);
    }

    reset();
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Type Selection */}
      <div className="grid grid-cols-2 gap-3">
        <label className="cursor-pointer">
          <input type="radio" {...register('type')} value="positive" className="peer sr-only" />
          <div className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 peer-checked:border-green-500 peer-checked:bg-green-50 dark:peer-checked:bg-green-900/30 transition-all text-center">
            <Smile className="w-6 h-6 mx-auto mb-1 text-green-500" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Positive</span>
          </div>
        </label>
        <label className="cursor-pointer">
          <input type="radio" {...register('type')} value="negative" className="peer sr-only" />
          <div className="p-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 peer-checked:border-red-500 peer-checked:bg-red-50 dark:peer-checked:bg-red-900/30 transition-all text-center">
            <Frown className="w-6 h-6 mx-auto mb-1 text-red-500" />
            <span className="text-sm font-medium text-red-700 dark:text-red-400">Negative</span>
          </div>
        </label>
      </div>

      {/* Note */}
      <div>
        <textarea 
          {...register('note')} 
          placeholder="Add note..."
          className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />
      </div>

      {/* Submit */}
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Record
          </>
        )}
      </button>
    </form>
  );
}
