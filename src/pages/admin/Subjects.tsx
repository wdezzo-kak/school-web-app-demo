import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { type Subject } from '../../types';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

function SkeletonRow() {
  return (
    <tr className="border-t">
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16 ml-auto animate-pulse"></div></td>
    </tr>
  );
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('subjects').select('*').order('name');
    
    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    const { data } = await query;
    if (data) setSubjects(data);
    setLoading(false);
  }, [searchTerm]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (editingSubject) {
      await supabase.from('subjects').update({
        name: formData.name,
      }).eq('id', editingSubject.id);
    } else {
      await supabase.from('subjects').insert({
        name: formData.name,
      });
    }

    setShowModal(false);
    setEditingSubject(null);
    setFormData({ name: '' });
    fetchSubjects();
  }

  async function handleDelete(id: string) {
    await supabase.from('subjects').delete().eq('id', id);
    setShowDeleteConfirm(null);
    fetchSubjects();
  }

  function openEdit(subject: Subject) {
    setEditingSubject(subject);
    setFormData({ name: subject.name });
    setShowModal(true);
  }

  function openAdd() {
    setEditingSubject(null);
    setFormData({ name: '' });
    setShowModal(true);
  }

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Subjects</h1>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="mb-4"><div className="h-10 w-96 bg-gray-200 rounded animate-pulse"></div></div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Subject Name</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Subjects</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
        >
          <Plus className="w-5 h-5" />
          Add Subject
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Subject Name</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4">{subject.name}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => openEdit(subject)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(subject.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {subjects.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <span className="text-2xl">📚</span>
                    </div>
                    <p className="text-lg font-medium">No subjects found</p>
                    <p className="text-sm">Add your first subject to get started</p>
                  </div>
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
              <h2 className="text-xl font-bold">
                {editingSubject ? 'Edit Subject' : 'Add Subject'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Mathematics"
                  />
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
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  {editingSubject ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this subject? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
