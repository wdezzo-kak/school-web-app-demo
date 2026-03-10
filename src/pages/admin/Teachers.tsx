import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { type Teacher } from '../../types';
import { Pencil, Trash2, X, ChevronLeft, ChevronRight, Search, GraduationCap, UserPlus } from 'lucide-react';

const PAGE_SIZE = 20;

function SkeletonRow() {
  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div></td>
      <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div></td>
      <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></td>
      <td className="px-4 py-4"><div className="h-8 w-16 ml-auto bg-gray-200 rounded animate-pulse"></div></td>
    </tr>
  );
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', national_id: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('teachers')
      .select('*', { count: 'exact' })
      .order('name')
      .range(from, to);

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,national_id.ilike.%${searchTerm}%`);
    }

    const { data, count } = await query;
    if (data) setTeachers(data);
    if (count !== null) setTotalCount(count);
    setLoading(false);
  }, [page, searchTerm]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (editingTeacher) {
      await supabase.from('teachers').update({
        name: formData.name,
        email: formData.email,
        national_id: formData.national_id,
      }).eq('id', editingTeacher.id);
    } else {
      await supabase.from('teachers').insert({
        name: formData.name,
        email: formData.email,
        national_id: formData.national_id,
      });
    }

    setShowModal(false);
    setEditingTeacher(null);
    setFormData({ name: '', email: '', national_id: '' });
    fetchTeachers();
  }

  async function handleDelete(id: string) {
    await supabase.from('teachers').delete().eq('id', id);
    setShowDeleteConfirm(null);
    fetchTeachers();
  }

  function openEdit(teacher: Teacher) {
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email,
      national_id: teacher.national_id,
    });
    setShowModal(true);
  }

  function openAdd() {
    setEditingTeacher(null);
    setFormData({ name: '', email: '', national_id: '' });
    setShowModal(true);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="h-12 w-full sm:w-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="table-container">
            <table className="table">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4">Name</th>
                  <th className="px-4">Email</th>
                  <th className="px-4">National ID</th>
                  <th className="px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teachers</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage teacher records and information</p>
        </div>
        <button
          onClick={openAdd}
          className="btn bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <UserPlus className="w-5 h-5" />
          Add Teacher
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or national ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10 w-full sm:w-80"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4">Name</th>
                <th className="px-4">Email</th>
                <th className="px-4">National ID</th>
                <th className="px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 font-medium text-gray-900">{teacher.name}</td>
                  <td className="px-4 text-gray-600">{teacher.email}</td>
                  <td className="px-4 text-gray-600">{teacher.national_id}</td>
                  <td className="px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(teacher)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(teacher.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <GraduationCap className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">No teachers found</p>
                      <p className="text-gray-500 text-sm mt-1">Add your first teacher to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{page * PAGE_SIZE + 1}</span> - <span className="font-medium">{Math.min((page + 1) * PAGE_SIZE, totalCount)}</span> of <span className="font-medium">{totalCount}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn btn-secondary text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="btn btn-secondary text-sm"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Enter teacher name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">National ID</label>
                <input
                  type="text"
                  required
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                  className="input"
                  placeholder="Enter national ID"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-emerald-600 text-white hover:bg-emerald-700 flex-1"
                >
                  {editingTeacher ? 'Update Teacher' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Teacher?</h2>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this teacher? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="btn btn-danger flex-1"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
