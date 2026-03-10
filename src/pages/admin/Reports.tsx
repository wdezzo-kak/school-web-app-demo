import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { type Student, type Teacher, type Class } from '../../types';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [studentsRes, teachersRes, classesRes] = await Promise.all([
      supabase.from('students').select('*, classes(name, grade)').order('name'),
      supabase.from('teachers').select('*').order('name'),
      supabase.from('classes').select('*').order('name'),
    ]);

    if (studentsRes.data) setStudents(studentsRes.data);
    if (teachersRes.data) setTeachers(teachersRes.data);
    if (classesRes.data) setClasses(classesRes.data);
    setLoading(false);
  }

  function exportToCSV() {
    let data: string[][] = [];
    let filename = '';

    switch (reportType) {
      case 'students':
        data = [
          ['Name', 'National ID', 'Class', 'Grade'],
          ...students.map(s => [
            s.name,
            s.national_id,
            s.classes?.name || '',
            s.classes?.grade || ''
          ])
        ];
        filename = 'students_report.csv';
        break;
      case 'teachers':
        data = [
          ['Name', 'Email', 'National ID'],
          ...teachers.map(t => [t.name, t.email, t.national_id])
        ];
        filename = 'teachers_report.csv';
        break;
      case 'classes':
        data = [
          ['Name', 'Grade'],
          ...classes.map(c => [c.name, c.grade])
        ];
        filename = 'classes_report.csv';
        break;
    }

    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border rounded-lg"
            >
              <option value="students">Students Report</option>
              <option value="teachers">Teachers Report</option>
              <option value="classes">Classes Report</option>
            </select>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="font-semibold text-gray-700">
            {reportType === 'students' && 'Students'}
            {reportType === 'teachers' && 'Teachers'}
            {reportType === 'classes' && 'Classes'}
          </h2>
        </div>
        
        {reportType === 'students' && (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">National ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Class</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">{student.name}</td>
                  <td className="px-6 py-4">{student.national_id}</td>
                  <td className="px-6 py-4">
                    {student.classes ? `${student.classes.name} - ${student.classes.grade}` : '-'}
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {reportType === 'teachers' && (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">National ID</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">{teacher.name}</td>
                  <td className="px-6 py-4">{teacher.email}</td>
                  <td className="px-6 py-4">{teacher.national_id}</td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No teachers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {reportType === 'classes' && (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Class Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Grade</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">{cls.name}</td>
                  <td className="px-6 py-4">{cls.grade}</td>
                </tr>
              ))}
              {classes.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                    No classes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
