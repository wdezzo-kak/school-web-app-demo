import { useAuth } from '../../contexts/AuthContext';
import { Users, Star, ClipboardList, CheckSquare, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  { label: 'My Students', description: 'View and manage your assigned students', icon: Users, path: '/teacher/students', color: 'blue' },
  { label: 'Skills', description: 'Track and record student skills', icon: Star, path: '/teacher/skills', color: 'amber' },
  { label: 'Behavior', description: 'Monitor student behavior records', icon: ClipboardList, path: '/teacher/behavior', color: 'purple' },
  { label: 'Attendance', description: 'Record and view attendance', icon: CheckSquare, path: '/teacher/attendance', color: 'emerald' },
];

const colorMap: Record<string, { bg: string; text: string; gradient: string }> = {
  blue: { bg: 'bg-blue-600', text: 'text-white', gradient: 'from-blue-500 to-blue-600' },
  amber: { bg: 'bg-amber-500', text: 'text-white', gradient: 'from-amber-500 to-amber-600' },
  purple: { bg: 'bg-purple-600', text: 'text-white', gradient: 'from-purple-500 to-purple-600' },
  emerald: { bg: 'bg-emerald-600', text: 'text-white', gradient: 'from-emerald-500 to-emerald-600' },
};

export default function TeacherDashboard() {
  const { profile } = useAuth();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {profile?.name}!</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Here's what you can manage today.</p>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature) => {
          const colors = colorMap[feature.color];
          return (
            <Link
              key={feature.path}
              to={feature.path}
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 p-5 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{feature.label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{feature.description}</p>
                </div>
                <div className={`${colors.gradient} p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`${colors.text} w-5 h-5`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                <span>Open</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-2">Teacher Portal</h2>
        <p className="text-gray-300 text-sm">
          Use the sidebar to navigate between different sections. You can manage your students, 
          track their skills and behaviors, and record attendance.
        </p>
      </div>
    </div>
  );
}
