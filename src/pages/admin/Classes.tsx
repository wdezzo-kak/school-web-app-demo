import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { type Class } from '../../types';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

function SkeletonRow() {
  return (
    <tr className="border-t">
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16 ml-auto animate-pulse"></div></td>
    </tr>
  );
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({ name: '', grade: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('classes').select('*').order('grade', { ascending: true }).order('name');
    
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,grade.ilike.%${searchTerm}%`);
    }

    const { data } = await query;
    if (data) setClasses(data);
    setLoading(false);
  }, [searchTerm]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (editingClass) {
      await supabase.from('classes').update({
        name: formData.name,
        grade: formData.grade,
      }).eq('id', editingClass.id);
    } else {
      await supabase.from('classes').insert({
        name: formData.name,
        grade: formData.grade,
      });
    }

    setShowModal(false);
    setEditingClass(null);
    setFormData({ name: '', grade: '' });
    fetchClasses();
  }

  async function handleDelete(id: string) {
    await supabase.from('classes').delete().eq('id', id);
    setShowDeleteConfirm(null);
    fetchClasses();
  }

  function openEdit(cls: Class) {
    setEditingClass(cls);
    setFormData({ name: cls.name, grade: cls.grade });
    setShowModal(true);
  }

  function openAdd() {
    setEditingClass(null);
    setFormData({ name: '', grade: '' });
    setShowModal(true);
  }

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Classes</h1>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="mb-4"><div className="h-10 w-96 bg-gray-200 rounded animate-pulse"></div></div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Class Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Grade</th>
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
        <h1 className="text-2xl font-bold text-gray-800">Classes</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          <Plus className="w-5 h-5" />
          Add Class
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or grade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Class Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Grade</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((cls) => (
              <tr key={cls.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4">{cls.name}</td>
                <td className="px-6 py-4">{cls.grade}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => openEdit(cls)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(cls.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <span className="text-2xl">🏫</span>
                    </div>
                    <p className="text-lg font-medium">No classes found</p>
                    <p className="text-sm">Add your first class to get started</p>
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
                {editingClass ? 'Edit Class' : 'Add Class'}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Class A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Grade</label>
                  <input
                    type="text"
                    required
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Grade 3"
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
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {editingClass ? 'Update' : 'Add'}
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
            <p className="text-gray-600 mb-6">Are you sure you want to delete this class? This action cannot be undone.</p>
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
