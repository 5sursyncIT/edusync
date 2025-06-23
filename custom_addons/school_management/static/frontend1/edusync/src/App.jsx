import React from 'react';
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { OdooProvider } from './contexts/OdooContext';
import Layout from './components/layout/Layout';
import LoginPage from './components/auth/LoginPage';
import Dashboard from './components/dashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import HomePage from './components/home';

// Students Components
import StudentList from './components/students/StudentList';
import StudentDetail from './components/students/StudentDetail';
import StudentCreate from './components/students/StudentCreate';
import StudentEdit from './components/students/StudentEdit';
import StudentsWithParents from './components/students/StudentsWithParents';

// Batches Components
import BatchList from './components/batches/BatchList';
import BatchDetail from './components/batches/BatchDetail';
import BatchEdit from './components/batches/BatchEdit';

// Teachers Components
import TeacherList from './components/teachers/TeacherList';
import TeacherDetail from './components/teachers/TeacherDetail';
import TeacherCreate from './components/teachers/TeacherCreate';
import TeacherEdit from './components/teachers/TeacherEdit';

// Courses Components
import CourseList from './components/courses/CourseList';
import CourseDetail from './components/courses/CourseDetail';
import CourseCreate from './components/courses/CourseCreate';
import CourseEdit from './components/courses/CourseEdit';
import TimetableManager from './components/timetable/TimetableManager';
import TimetableDetail from './components/timetable/TimetableDetail';
import TimetableCreate from './components/timetable/TimetableCreate';
import TimetableEdit from './components/timetable/TimetableEdit';
// Other Components
import ExamList from './components/exams/ExamList';
import AttendanceRegister from './components/attendance/AttendanceRegister';
import AttendanceCrudManager from './components/attendance/AttendanceCrudManager';
import AttendanceDashboard from './components/attendance/AttendanceDashboard';
import AttendanceDemo from './components/attendance/AttendanceDemo';
import AttendanceList from './components/attendance/AttendanceList';
import AttendanceReport from './components/attendance/AttendanceReports';
import SessionAttendance  from './components/attendance/SessionAttendance';
import SessionCreate  from './components/attendance/SessionCreate';
import SessionDetail  from './components/attendance/SessionDetail';
import SessionList from './components/attendance/SessionList';
import SessionManager from './components/attendance/SessionManager';

import BulletinManager from './components/bulletins/BulletinManager';

import ParentPortal from './components/parent/ParentPortal';

import SubjectList from './components/subjects/SubjectList';
import SubjectDetail from './components/subjects/SubjectDetail';
import SubjectCreate from './components/subjects/SubjectForm';
import SubjectEditForm from './components/subjects/SubjectForm';  
import BatchCreateForm from './components/batches/BatchForm';
import PublicAdmissionForm from './components/admissions/PublicAdmissionForm';
import AdmissionsManagement from './components/admissions/AdmissionsManagement';
import ApiDiagnostic from './components/debug/ApiDiagnostic';
import BooksList from './components/library/BooksList';
import AuthorsList from './components/library/AuthorsList';
import CategoriesList from './components/library/CategoriesList';
import BorrowingsList from './components/library/BorrowingsList';
import LibraryDashboard from './components/library/LibraryDashboard';
import AdmissionsList from './components/admissions/AdmissionsList';
import AdmissionForm from './components/admissions/components/AdmissionForm';
import ExamCreate from './components/exams/ExamCreate';
import ExamDetail from './components/exams/ExamDetail';
import ExamEdit from './components/exams/ExamEdit';
import BookDetails from './components/library/BookDetails';
import BookEdit from './components/library/BookEdit';
import BookCreate from './components/library/BookCreate';
import SessionsTest from './components/test/SessionsTest';
import AttendanceTest from './components/attendance/AttendanceTest';
import StatisticsTest from './components/test/StatisticsTest';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
// Bulletins and Evaluations Components
import BulletinDashboard from './components/bulletins/BulletinDashboard';
import BulletinDetail from './components/bulletins/BulletinDetail';
import BulletinEdit from './components/bulletins/BulletinEdit';
import BulletinCreate from './components/bulletins/BulletinCreate';
import BulletinBatchGeneration from './components/bulletins/BulletinBatchGeneration';
import EvaluationManager from './components/evaluations/EvaluationManager';
import FeesManagement from './components/fees/FeesManagement';
import ParentsManagement from './components/parents/ParentsManagement';
import TestStudents from './components/TestStudents';

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <OdooProvider>
        <AuthProvider>
          <Layout>
            <Routes>
              {/* Authentification */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Page d'accueil */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/formulaire-publique" element={<PublicAdmissionForm />} />
              {/* Dashboard principal */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              
              {/* Route de test temporaire */}
              <Route path="/test-students" element={<ProtectedRoute><TestStudents /></ProtectedRoute>} />
              
              {/* Routes des étudiants */}
              <Route path="/students" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />
              <Route path="/dashboard/students" element={<ProtectedRoute><StudentList /></ProtectedRoute>} />
              <Route path="/dashboard/students/:id" element={<ProtectedRoute><StudentDetail /></ProtectedRoute>} />
              <Route path="/dashboard/students/:id/edit" element={<ProtectedRoute><StudentEdit /></ProtectedRoute>} />
              <Route path="/dashboard/students/new" element={<ProtectedRoute><StudentCreate /></ProtectedRoute>} />
              <Route path="/students/:id" element={<ProtectedRoute><StudentDetail /></ProtectedRoute>} />
              <Route path="/students/:id/edit" element={<ProtectedRoute><StudentEdit /></ProtectedRoute>} />
              <Route path="/students/new" element={<ProtectedRoute><StudentCreate /></ProtectedRoute>} />
              
              {/* Route pour les étudiants avec parents */}
              <Route path="/students-parents" element={<ProtectedRoute><StudentsWithParents /></ProtectedRoute>} />
              <Route path="/dashboard/students-parents" element={<ProtectedRoute><StudentsWithParents /></ProtectedRoute>} />

              {/* Routes des promotions */}
              <Route path="/batches" element={<ProtectedRoute><BatchList /></ProtectedRoute>} />
              <Route path="/dashboard/batches" element={<ProtectedRoute><BatchList /></ProtectedRoute>} />
              <Route path="/batches/:id" element={<ProtectedRoute><BatchDetail /></ProtectedRoute>} />
              <Route path="/dashboard/batches/:id" element={<ProtectedRoute><BatchDetail /></ProtectedRoute>} />
              <Route path="/batches/:id/edit" element={<ProtectedRoute><BatchEdit /></ProtectedRoute>} />
              <Route path="/dashboard/batches/:id/edit" element={<ProtectedRoute><BatchEdit /></ProtectedRoute>} />
              <Route path="/batches/new" element={<ProtectedRoute><BatchCreateForm /></ProtectedRoute>} />
              <Route path="/dashboard/batches/new" element={<ProtectedRoute><BatchCreateForm /></ProtectedRoute>} />

              {/* Routes des enseignants */}
              <Route path="/teachers" element={<ProtectedRoute><TeacherList /></ProtectedRoute>} />
              <Route path="/dashboard/teachers" element={<ProtectedRoute><TeacherList /></ProtectedRoute>} />
              <Route path="/teachers/:id" element={<ProtectedRoute><TeacherDetail /></ProtectedRoute>} />
              <Route path="/dashboard/teachers/:id" element={<ProtectedRoute><TeacherDetail /></ProtectedRoute>} />
              <Route path="/teachers/:id/edit" element={<ProtectedRoute><TeacherEdit /></ProtectedRoute>} />
              <Route path="/dashboard/teachers/:id/edit" element={<ProtectedRoute><TeacherEdit /></ProtectedRoute>} />
              <Route path="/teachers/new" element={<ProtectedRoute><TeacherCreate /></ProtectedRoute>} />
              <Route path="/dashboard/teachers/new" element={<ProtectedRoute><TeacherCreate /></ProtectedRoute>} />

              {/* Routes des cours */}
              <Route path="/courses" element={<ProtectedRoute><CourseList /></ProtectedRoute>} />
              <Route path="/dashboard/courses" element={<ProtectedRoute><CourseList /></ProtectedRoute>} />
              <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
              <Route path="/dashboard/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
              <Route path="/courses/:id/edit" element={<ProtectedRoute><CourseEdit /></ProtectedRoute>} />
              <Route path="/dashboard/courses/:id/edit" element={<ProtectedRoute><CourseEdit /></ProtectedRoute>} />
              <Route path="/courses/new" element={<ProtectedRoute><CourseCreate /></ProtectedRoute>} />
              <Route path="/dashboard/courses/new" element={<ProtectedRoute><CourseCreate /></ProtectedRoute>} />

              {/* Routes des matières */}
              <Route path="/subjects" element={<ProtectedRoute><SubjectList /></ProtectedRoute>} />
              <Route path="/dashboard/subjects" element={<ProtectedRoute><SubjectList /></ProtectedRoute>} />
              <Route path="/subjects/:id" element={<ProtectedRoute><SubjectDetail /></ProtectedRoute>} />
              <Route path="/dashboard/subjects/:id" element={<ProtectedRoute><SubjectDetail /></ProtectedRoute>} />
              <Route path="/subjects/:id/edit" element={<ProtectedRoute><SubjectEditForm /></ProtectedRoute>} />
              <Route path="/dashboard/subjects/:id/edit" element={<ProtectedRoute><SubjectEditForm /></ProtectedRoute>} />
              <Route path="/subjects/new" element={<ProtectedRoute><SubjectCreate /></ProtectedRoute>} />
              <Route path="/dashboard/subjects/new" element={<ProtectedRoute><SubjectCreate /></ProtectedRoute>} />

              {/* Routes des examens */}
              <Route path="/exams" element={<ProtectedRoute><ExamList /></ProtectedRoute>} />
              <Route path="/dashboard/exams" element={<ProtectedRoute><ExamList /></ProtectedRoute>} />
              <Route path="/exams/new" element={<ProtectedRoute><ExamCreate /></ProtectedRoute>} />
              <Route path="/dashboard/exams/new" element={<ProtectedRoute><ExamCreate /></ProtectedRoute>} />
              <Route path="/exams/:id" element={<ProtectedRoute><ExamDetail /></ProtectedRoute>} />
              <Route path="/dashboard/exams/:id" element={<ProtectedRoute><ExamDetail /></ProtectedRoute>} />
              <Route path="/exams/:id/edit" element={<ProtectedRoute><ExamEdit /></ProtectedRoute>} />
              <Route path="/dashboard/exams/:id/edit" element={<ProtectedRoute><ExamEdit /></ProtectedRoute>} />

              {/* Routes des bulletins */}
              <Route path="/bulletins" element={<ProtectedRoute><BulletinManager /></ProtectedRoute>} />
              <Route path="/dashboard/bulletins" element={<ProtectedRoute><BulletinManager /></ProtectedRoute>} />
              <Route path="/bulletins/dashboard" element={<ProtectedRoute><BulletinDashboard /></ProtectedRoute>} />
              <Route path="/bulletins/create" element={<ProtectedRoute><BulletinCreate /></ProtectedRoute>} />
              <Route path="/bulletins/batch-generation" element={<ProtectedRoute><BulletinBatchGeneration /></ProtectedRoute>} />
              <Route path="/bulletins/:id" element={<ProtectedRoute><BulletinDetail /></ProtectedRoute>} />
              <Route path="/bulletins/:id/edit" element={<ProtectedRoute><BulletinEdit /></ProtectedRoute>} />
              <Route path="/dashboard/bulletins/create" element={<ProtectedRoute><BulletinCreate /></ProtectedRoute>} />
              <Route path="/dashboard/bulletins/batch-generation" element={<ProtectedRoute><BulletinBatchGeneration /></ProtectedRoute>} />
              <Route path="/dashboard/bulletins/:id" element={<ProtectedRoute><BulletinDetail /></ProtectedRoute>} />
              <Route path="/dashboard/bulletins/:id/edit" element={<ProtectedRoute><BulletinEdit /></ProtectedRoute>} />

              {/* Routes des évaluations */}
              <Route path="/evaluations" element={<ProtectedRoute><EvaluationManager /></ProtectedRoute>} />
              <Route path="/dashboard/evaluations" element={<ProtectedRoute><EvaluationManager /></ProtectedRoute>} />
              
              {/* Routes des présences/attendance - Réorganisées et clarifiées */}
              
              {/* Pages principales d'attendance */}
              <Route path="/attendance" element={<ProtectedRoute><AttendanceList /></ProtectedRoute>} />
              <Route path="/dashboard/attendance" element={<ProtectedRoute><AttendanceList /></ProtectedRoute>} />
              
              {/* Dashboard des présences */}
              <Route path="/attendance/dashboard" element={<ProtectedRoute><AttendanceDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/attendance/dashboard" element={<ProtectedRoute><AttendanceDashboard /></ProtectedRoute>} />
              
              {/* Liste des présences */}
              <Route path="/attendance/list" element={<ProtectedRoute><AttendanceList /></ProtectedRoute>} />
              <Route path="/dashboard/attendance/list" element={<ProtectedRoute><AttendanceList /></ProtectedRoute>} />
              
              {/* Prise de présence (Registre) */}
              <Route path="/attendance/register" element={<ProtectedRoute><AttendanceRegister /></ProtectedRoute>} />
              <Route path="/dashboard/attendance/register" element={<ProtectedRoute><AttendanceRegister /></ProtectedRoute>} />
              <Route path="/attendance/register/new" element={<ProtectedRoute><AttendanceRegister /></ProtectedRoute>} />
              <Route path="/dashboard/attendance/register/new" element={<ProtectedRoute><AttendanceRegister /></ProtectedRoute>} />
              
              {/* Gestion CRUD des présences */}
              <Route path="/attendance/crud" element={<ProtectedRoute><AttendanceCrudManager /></ProtectedRoute>} />
              <Route path="/dashboard/attendance/crud" element={<ProtectedRoute><AttendanceCrudManager /></ProtectedRoute>} />
              
              {/* Rapports de présence */}
              <Route path="/attendance/reports" element={<ProtectedRoute><AttendanceReport /></ProtectedRoute>} />
              <Route path="/dashboard/attendance/reports" element={<ProtectedRoute><AttendanceReport /></ProtectedRoute>} />
              
              {/* Demo et diagnostic */}
              <Route path="/attendance/demo" element={<ProtectedRoute><AttendanceDemo /></ProtectedRoute>} />
              <Route path="/dashboard/attendance/demo" element={<ProtectedRoute><AttendanceDemo /></ProtectedRoute>} />
              
              {/* Routes avec paramètres ID - à la fin pour éviter les conflits */}
              <Route path="/attendance/:id" element={<ProtectedRoute><AttendanceRegister /></ProtectedRoute>} />
              <Route path="/dashboard/attendance/:id" element={<ProtectedRoute><AttendanceRegister /></ProtectedRoute>} />
              <Route path="/attendance/:id/edit" element={<ProtectedRoute><AttendanceRegister /></ProtectedRoute>} />
              <Route path="/dashboard/attendance/:id/edit" element={<ProtectedRoute><AttendanceRegister /></ProtectedRoute>} />

              {/* Routes des sessions - Réorganisées et clarifiées */}
              
              {/* Liste des sessions */}
              <Route path="/sessions" element={<ProtectedRoute><SessionList /></ProtectedRoute>} />
              <Route path="/dashboard/sessions" element={<ProtectedRoute><SessionList /></ProtectedRoute>} />
              
              {/* Gestionnaire de sessions */}
              <Route path="/sessions/manager" element={<ProtectedRoute><SessionManager /></ProtectedRoute>} />
              
              {/* Création de session */}
              <Route path="/sessions/new" element={<ProtectedRoute><SessionCreate /></ProtectedRoute>} />
              
              {/* Routes avec paramètres ID - à la fin pour éviter les conflits */}
              <Route path="/sessions/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
              <Route path="/dashboard/sessions/:id" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
              <Route path="/sessions/:id/attendance" element={<ProtectedRoute><SessionAttendance /></ProtectedRoute>} />
              <Route path="/dashboard/sessions/:id/attendance" element={<ProtectedRoute><SessionAttendance /></ProtectedRoute>} />

              {/* Routes de la bibliothèque */}
              <Route path="/library" element={<ProtectedRoute><LibraryDashboard/></ProtectedRoute>} />
              <Route path="/library/books" element={<ProtectedRoute><BooksList /></ProtectedRoute>} />
              <Route path="/library/books/new" element={<ProtectedRoute><BookCreate /></ProtectedRoute>} />
              <Route path="/library/books/:id" element={<ProtectedRoute><BookDetails /></ProtectedRoute>} />
              <Route path="/library/books/:id/edit" element={<ProtectedRoute><BookEdit /></ProtectedRoute>} />
              <Route path="/library/authors" element={<ProtectedRoute><AuthorsList /></ProtectedRoute>} />
              <Route path="/library/categories" element={<ProtectedRoute><CategoriesList /></ProtectedRoute>} />
              <Route path="/library/borrowings" element={<ProtectedRoute><BorrowingsList /></ProtectedRoute>} />
              <Route path="/library/statistics" element={<ProtectedRoute><LibraryDashboard /></ProtectedRoute>} />
              <Route path="/library/:id" element={<ProtectedRoute><LibraryDashboard/></ProtectedRoute>} />
              <Route path="/dashboard/library/:id" element={<ProtectedRoute><LibraryDashboard/></ProtectedRoute>} />
              <Route path="/library/:id/edit" element={<ProtectedRoute><LibraryDashboard/></ProtectedRoute>} />
              <Route path="/dashboard/library/:id/edit" element={<ProtectedRoute><LibraryDashboard/></ProtectedRoute>} />
              <Route path="/library/new" element={<ProtectedRoute><LibraryDashboard/></ProtectedRoute>} />
              <Route path="/dashboard/library/new" element={<ProtectedRoute><LibraryDashboard/></ProtectedRoute>} />

               {/* Route publique pour les demandes d'admission */}
              <Route path="/admission" element={<PublicAdmissionForm />} />
          
              {/* Routes des admissions - Section complète */}
              
              {/* Page principale de gestion des admissions */}
              <Route path="/admissions" element={<ProtectedRoute><AdmissionsManagement /></ProtectedRoute>} />
              <Route path="/dashboard/admissions" element={<ProtectedRoute><AdmissionsManagement /></ProtectedRoute>} />
              
              {/* Liste des admissions */}
              <Route path="/admissions/list" element={<ProtectedRoute><AdmissionsList /></ProtectedRoute>} />
              {/* Création d'admission */}
              <Route path="/admissions/create" element={<ProtectedRoute><AdmissionForm /></ProtectedRoute>} />
              {/* Formulaire public d'admission */}
              <Route path="/admissions/public-form" element={<PublicAdmissionForm />} />              
              {/* Routes avec paramètres ID - à la fin pour éviter les conflits */}
              <Route path="/admissions/:id" element={<ProtectedRoute><AdmissionsManagement /></ProtectedRoute>} />
              <Route path="/dashboard/admissions/:id" element={<ProtectedRoute><AdmissionsManagement /></ProtectedRoute>} />
              <Route path="/admissions/:id/edit" element={<ProtectedRoute><AdmissionsManagement /></ProtectedRoute>} />
              <Route path="/dashboard/admissions/:id/edit" element={<ProtectedRoute><AdmissionsManagement /></ProtectedRoute>} />
              {/* Routes des emplois du temps */}
              <Route path="/timetables" element={<ProtectedRoute><TimetableManager/></ProtectedRoute>} />
              <Route path="/timetables/:id" element={<ProtectedRoute><TimetableDetail /></ProtectedRoute>} />
              <Route path="/timetables/new" element={<ProtectedRoute><TimetableCreate /></ProtectedRoute>} />
              <Route path="/fees" element={<ProtectedRoute><FeesManagement /></ProtectedRoute>} />
              <Route path="/parents" element={<ProtectedRoute><ParentsManagement /></ProtectedRoute>} />
              <Route path="/dashboard/parents" element={<ProtectedRoute><ParentsManagement /></ProtectedRoute>} />
              <Route path="/timetables/:id/edit" element={<ProtectedRoute><TimetableEdit /></ProtectedRoute>} />
              

              <Route path="/parent" element={<ParentPortal />} />

              {/* Route de diagnostic API */}
              <Route path="/debug/api" element={<ApiDiagnostic />} />
              <Route path="/students-parents" element={<StudentsWithParents />} />

              

              {/* Tests et debugging */}
              <Route path="/test/statistics" element={<StatisticsTest />} />
              <Route path="/test/sessions" element={<SessionsTest />} />
              <Route path="/test/attendance" element={<AttendanceTest />} />
              
              {/* Redirection par défaut */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </OdooProvider>
    </BrowserRouter>
  );
}

export default App;
