import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import TeacherLayout from './components/layouts/TeacherLayout'
import AdminLayout from './components/layouts/AdminLayout'
import ParentLayout from './components/layouts/ParentLayout'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import MyStudents from './pages/teacher/MyStudents'
import SkillsPage from './pages/teacher/Skills'
import BehaviorPage from './pages/teacher/Behavior'
import AttendancePage from './pages/teacher/Attendance'
import AdminDashboard from './pages/admin/AdminDashboard'
import StudentsPage from './pages/admin/Students'
import TeachersPage from './pages/admin/Teachers'
import ClassesPage from './pages/admin/Classes'
import SubjectsPage from './pages/admin/Subjects'
import AssignmentsPage from './pages/admin/Assignments'
import UploadPage from './pages/admin/Upload'
import ReportsPage from './pages/admin/Reports'
import ParentDashboard from './pages/parent/ParentDashboard'
import ParentSkills from './pages/parent/ParentSkills'
import ParentBehavior from './pages/parent/ParentBehavior'
import ParentAttendance from './pages/parent/ParentAttendance'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="teachers" element={<TeachersPage />} />
              <Route path="classes" element={<ClassesPage />} />
              <Route path="subjects" element={<SubjectsPage />} />
              <Route path="assignments" element={<AssignmentsPage />} />
              <Route path="upload" element={<UploadPage />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>
            
            <Route path="/teacher/*" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherLayout />
              </ProtectedRoute>
            }>
              <Route index element={<TeacherDashboard />} />
              <Route path="students" element={<MyStudents />} />
              <Route path="skills" element={<SkillsPage />} />
              <Route path="behavior" element={<BehaviorPage />} />
              <Route path="attendance" element={<AttendancePage />} />
            </Route>
            
            <Route path="/parent/*" element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentLayout />
              </ProtectedRoute>
            }>
              <Route index element={<ParentDashboard />} />
              <Route path="dashboard" element={<ParentDashboard />} />
              <Route path="skills" element={<ParentSkills />} />
              <Route path="behavior" element={<ParentBehavior />} />
              <Route path="attendance" element={<ParentAttendance />} />
            </Route>
            
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
