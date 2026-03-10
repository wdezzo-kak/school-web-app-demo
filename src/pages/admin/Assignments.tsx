import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { type Teacher, type Class, type Subject, type TeacherAssignment } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ teacher_id: '', class_id: '', subject_id: '' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [assignmentsRes, teachersRes, classesRes, subjectsRes] = await Promise.all([
      supabase.from('teacher_assignments').select('*, teachers(name), classes(name, grade), subjects(name)'),
      supabase.from('teachers').select('*').order('name'),
      supabase.from('classes').select('*').order('name'),
      supabase.from('subjects').select('*').order('name'),
    ]);

    if (assignmentsRes.data) setAssignments(assignmentsRes.data);
    if (teachersRes.data) setTeachers(teachersRes.data);
    if (classesRes.data) setClasses(classesRes.data);
    if (subjectsRes.data) setSubjects(subjectsRes.data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    await supabase.from('teacher_assignments').insert({
      teacher_id: formData.teacher_id,
      class_id: formData.class_id,
      subject_id: formData.subject_id,
    });

    setShowModal(false);
    setFormData({ teacher_id: '', class_id: '', subject_id: '' });
    fetchData();
  }

  async function handleDelete(teacherId: string, classId: string, subjectId: string) {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    await supabase.from('teacher_assignments').delete()
      .eq('teacher_id', teacherId)
      .eq('class_id', classId)
      .eq('subject_id', subjectId);
    fetchData();
  }

  function openAdd() {
    setFormData({ teacher_id: '', class_id: '', subject_id: '' });
    setShowModal(true);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Teacher Assignments</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-5 h-5" />
          Add Assignment
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Teacher</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Class</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Subject</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={`${assignment.teacher_id}-${assignment.class_id}-${assignment.subject_id}`} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4">{assignment.teachers?.name || '-'}</td>
                <td className="px-6 py-4">
                  {assignment.classes ? `${assignment.classes.name} - ${assignment.classes.grade}` : '-'}
                </td>
                <td className="px-6 py-4">{assignment.subjects?.name || '-'}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(assignment.teacher_id, assignment.class_id, assignment.subject_id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No assignments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Assignment</h2>
              <button onClick={() => setShowModal(false)}>
                <Trash2 className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teacher</label>
                  <select
                    required
                    value={formData.teacher_id}
                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class</label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.grade}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <select
                    required
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
