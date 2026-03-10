import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, BookOpen, ClipboardList, Upload, FileText, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Stats {
  students: number;
  teachers: number;
  classes: number;
  subjects: number;
  assignments: number;
}

const statCards = [
  { label: 'Students', key: 'students' as keyof Stats, icon: Users, gradient: 'from-blue-500 to-blue-600', path: '/admin/students' },
  { label: 'Teachers', key: 'teachers' as keyof Stats, icon: GraduationCap, gradient: 'from-emerald-500 to-emerald-600', path: '/admin/teachers' },
  { label: 'Classes', key: 'classes' as keyof Stats, icon: BookOpen, gradient: 'from-purple-500 to-purple-600', path: '/admin/classes' },
  { label: 'Subjects', key: 'subjects' as keyof Stats, icon: BookOpen, gradient: 'from-orange-500 to-orange-600', path: '/admin/subjects' },
  { label: 'Assignments', key: 'assignments' as keyof Stats, icon: ClipboardList, gradient: 'from-teal-500 to-teal-600', path: '/admin/assignments' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    students: 0,
    teachers: 0,
    classes: 0,
    subjects: 0,
    assignments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [studentsRes, teachersRes, classesRes, subjectsRes, assignmentsRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('teacher_assignments').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        students: studentsRes.count || 0,
        teachers: teachersRes.count || 0,
        classes: classesRes.count || 0,
        subjects: subjectsRes.count || 0,
        assignments: assignmentsRes.count || 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 skeleton" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's an overview of your school.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>All systems operational</span>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const count = stats[card.key];
          return (
            <Link
              key={card.label}
              to={card.path}
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-5 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{count}</p>
                </div>
                <div className={`${card.gradient} p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                <span>View all</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/admin/upload"
              className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700 dark:text-blue-300 rounded-xl hover:from-blue-100 dark:hover:from-blue-900/50 hover:to-blue-100 dark:hover:to-blue-800/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium">Upload CSV Data</span>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/admin/reports"
              className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/20 text-emerald-700 dark:text-emerald-300 rounded-xl hover:from-emerald-100 dark:hover:from-emerald-900/50 hover:to-emerald-100 dark:hover:to-emerald-800/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium">View Reports</span>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 text-white">
          <h2 className="text-lg font-semibold mb-4">System Overview</h2>
          <div className="space-y-4">
            <p className="text-gray-300 dark:text-gray-300">
              School Skills & Behavior Management System
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-400">
              Manage students, teachers, classes, and track skills, behaviors, and attendance — all in one place.
            </p>
            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-gray-700">
              <div>
                <div className="text-2xl font-bold">{stats.students}</div>
                <div className="text-xs text-gray-400">Students</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.teachers}</div>
                <div className="text-xs text-gray-400">Teachers</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.classes}</div>
                <div className="text-xs text-gray-400">Classes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
