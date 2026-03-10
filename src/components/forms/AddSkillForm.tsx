import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Upload, X, Loader2 } from 'lucide-react';

const schema = z.object({
  skill_name: z.string().min(1, 'Skill name required'),
  note: z.string().optional(),
});

interface Props {
  studentId: string;
  onSuccess: () => void;
}

export default function AddSkillForm({ studentId, onSuccess }: Props) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 300 * 1024) {
        alert('File size must be less than 300KB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${studentId}/${fileName}`;

    const { error } = await supabase.storage.from('skill-images').upload(filePath, file);
    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from('skill-images').getPublicUrl(filePath);
    return publicUrl;
  };

  const onSubmit = async (data: any) => {
    setUploading(true);
    
    try {
      const { data: teacherData } = await supabase
        .from('teacher_accounts')
        .select('teacher_id')
        .eq('user_id', user!.id)
        .single();

      if (!teacherData) return;

      let imageUrl = null;
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      const { error } = await supabase.from('skills').insert({
        student_id: studentId,
        teacher_id: teacherData.teacher_id,
        skill_name: data.skill_name,
        note: data.note,
        image_url: imageUrl,
      });

      if (error) {
        console.error('Error adding skill:', error);
        return;
      }

      // Notifications
      const { data: parentLinks } = await supabase
        .from('parent_students')
        .select('parent_user_id')
        .eq('student_id', studentId);

      if (parentLinks && parentLinks.length > 0) {
        const notifications = parentLinks.map(p => ({
          student_id: studentId,
          user_id: p.parent_user_id,
          title: 'New Skill Recorded',
          message: `Skill "${data.skill_name}" recorded for your child.`,
        }));
        await supabase.from('notifications').insert(notifications);
      }

      reset();
      removeImage();
      onSuccess();
    } finally {
      setUploading(false);
    }
  };

  const isLoading = isSubmitting || uploading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Skill Name */}
      <div>
        <input 
          {...register('skill_name')} 
          placeholder="Skill name"
          className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.skill_name && <p className="text-red-500 text-xs mt-1">{errors.skill_name.message as string}</p>}
      </div>

      {/* Note */}
      <div>
        <textarea 
          {...register('note')} 
          placeholder="Add note..."
          className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={2}
        />
      </div>

      {/* Image Upload */}
      <div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {imagePreview ? (
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 w-full justify-center"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm">Add Image</span>
          </button>
        )}
        <p className="text-xs text-gray-500 mt-1">Max 300KB</p>
      </div>

      {/* Submit */}
      <button 
        type="submit" 
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Skill'
        )}
      </button>
    </form>
  );
}
