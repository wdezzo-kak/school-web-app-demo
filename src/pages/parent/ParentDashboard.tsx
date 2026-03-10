import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Student, Skill, Behavior, Attendance } from '../../types';
import { User, Star, ClipboardList, CheckSquare, ChevronDown, Calendar, TrendingUp } from 'lucide-react';

interface Props {
  initialTab?: 'overview' | 'skills' | 'behavior' | 'attendance';
}

export default function ParentDashboard({ initialTab = 'overview' }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [behaviors, setBehaviors] = useState<Behavior[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'behavior' | 'attendance'>(initialTab);
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentData(selectedStudent.id);
    }
  }, [selectedStudent]);

  async function fetchStudents() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // First get the parent_students links
    const { data: links, error: linksError } = await supabase
      .from('parent_students')
      .select('student_id')
      .eq('parent_user_id', user.id);

    if (linksError) {
      console.error('Error fetching student links:', linksError);
      setLoading(false);
      return;
    }

    if (!links || links.length === 0) {
      setLoading(false);
      return;
    }

    // Then get the student details
    const studentIds = links.map(l => l.student_id);
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .in('id', studentIds);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      setLoading(false);
      return;
    }

    // Get classes for these students
    const classIds = [...new Set(studentsData?.map(s => s.class_id).filter(Boolean) || [])];
    let classesData: any[] = [];
    if (classIds.length > 0) {
      const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIds);
      classesData = classes || [];
    }

    // Combine student data with class data
    const studentsWithClasses = studentsData?.map(student => ({
      ...student,
      classes: classesData.find(c => c.id === student.class_id)
    })) || [];

    if (studentsWithClasses.length > 0) {
      setStudents(studentsWithClasses);
      setSelectedStudent(studentsWithClasses[0]);
    }
    setLoading(false);
  }

  async function fetchStudentData(studentId: string) {
    const [skillsRes, behaviorsRes, attendanceRes] = await Promise.all([
      supabase.from('skills').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
      supabase.from('behaviors').select('*').eq('student_id', studentId).order('created_at', { ascending: false }),
      supabase.from('attendance').select('*').eq('student_id', studentId).order('date', { ascending: false }),
    ]);

    setSkills(skillsRes.data || []);
    setBehaviors(behaviorsRes.data || []);
    setAttendance(attendanceRes.data || []);
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="h-12 w-full max-w-md skeleton" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-4">Parent Dashboard</h1>
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">No students linked to your account.</p>
          <p className="text-sm text-gray-500 mt-2">Please contact the school administration to link your children to your account.</p>
        </div>
      </div>
    );
  }

  const positiveBehaviors = behaviors.filter(b => b.type === 'positive').length;
  const negativeBehaviors = behaviors.filter(b => b.type === 'negative').length;
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const attendancePercentage = attendance.length > 0 ? Math.round((presentDays / attendance.length) * 100) : 0;

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: TrendingUp },
    { id: 'skills' as const, label: `Skills (${skills.length})`, icon: Star },
    { id: 'behavior' as const, label: `Behavior (${behaviors.length})`, icon: ClipboardList },
    { id: 'attendance' as const, label: `Attendance (${attendance.length})`, icon: CheckSquare },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
        <p className="text-gray-500 mt-1">Track your child's progress at school</p>
      </div>

      {/* Student Selector */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
        <button
          onClick={() => setStudentDropdownOpen(!studentDropdownOpen)}
          className="w-full max-w-md flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">{selectedStudent?.name}</div>
              <div className="text-sm text-gray-500">{selectedStudent?.classes?.name} - {selectedStudent?.classes?.grade}</div>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${studentDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {studentDropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
            {students.map(student => (
              <button
                key={student.id}
                onClick={() => {
                  setSelectedStudent(student);
                  setStudentDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${selectedStudent?.id === student.id ? 'bg-emerald-50' : ''}`}
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">{student.name}</div>
                  <div className="text-sm text-gray-500">{student.classes?.name} - {student.classes?.grade}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedStudent && (
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex gap-1 -mb-px min-w-max">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Skills</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{skills.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Positive Behaviors</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{positiveBehaviors}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Negative Behaviors</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{negativeBehaviors}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Attendance</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">{attendancePercentage}%</p>
                    <p className="text-xs text-gray-400">{presentDays}/{attendance.length} days</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="card overflow-hidden p-0">
              <div className="table-container">
                <table className="table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4">Image</th>
                      <th className="px-4">Skill</th>
                      <th className="px-4">Note</th>
                      <th className="px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skills.map(skill => (
                      <tr key={skill.id} className="border-t border-gray-100">
                        <td className="px-4">
                          {skill.image_url && (
                            <img src={skill.image_url} alt="Skill" className="w-12 h-12 object-cover rounded-lg border" />
                          )}
                        </td>
                        <td className="px-4 font-medium">{skill.skill_name}</td>
                        <td className="px-4 text-gray-600">{skill.note || '-'}</td>
                        <td className="px-4 text-gray-500">{new Date(skill.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {skills.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <Star className="w-10 h-10 text-gray-300 mb-2" />
                            <p className="text-gray-500">No skills recorded yet.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Behavior Tab */}
          {activeTab === 'behavior' && (
            <div className="card overflow-hidden p-0">
              <div className="table-container">
                <table className="table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4">Type</th>
                      <th className="px-4">Note</th>
                      <th className="px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {behaviors.map(behavior => (
                      <tr key={behavior.id} className="border-t border-gray-100">
                        <td className="px-4">
                          <span className={`badge ${behavior.type === 'positive' ? 'badge-success' : 'badge-error'}`}>
                            {behavior.type}
                          </span>
                        </td>
                        <td className="px-4 text-gray-600">{behavior.note || '-'}</td>
                        <td className="px-4 text-gray-500">{new Date(behavior.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {behaviors.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <ClipboardList className="w-10 h-10 text-gray-300 mb-2" />
                            <p className="text-gray-500">No behaviors recorded yet.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div className="card overflow-hidden p-0">
              <div className="table-container">
                <table className="table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4">Date</th>
                      <th className="px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map(record => (
                      <tr key={record.id} className="border-t border-gray-100">
                        <td className="px-4">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="px-4">
                          <span className={`badge ${
                            record.status === 'present' ? 'badge-success' :
                            record.status === 'absent' ? 'badge-error' :
                            'badge-warning'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <CheckSquare className="w-10 h-10 text-gray-300 mb-2" />
                            <p className="text-gray-500">No attendance records yet.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
