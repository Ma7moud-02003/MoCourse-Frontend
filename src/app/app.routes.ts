import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { AuthService } from './core/auth.service';

// Where the bare address (/) sends you: the page for your role when you are logged in.
// A student goes to the courses page, a teacher to the teacher area, an admin to the admin area.
const homePage = () => inject(AuthService).home();

// Which URL shows which page. loadComponent = lazy loading:
// a page's code is downloaded only when someone opens it.
export const routes: Routes = [
  // The courses page is the first thing a student sees.
  { path: '', pathMatch: 'full', redirectTo: homePage },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register').then((m) => m.Register),
  },
  {
    // only for logged-in users (the guard checks)
    path: 'courses',
    canActivate: [authGuard],
    loadComponent: () => import('./courses/course-list/course-list').then((m) => m.CourseList),
  },
  {
    // the courses a student joined and how far he got in each
    path: 'my-courses',
    canActivate: [authGuard],
    loadComponent: () => import('./courses/my-courses/my-courses').then((m) => m.MyCourses),
  },
  {
    // the certificates a student earned
    path: 'certificates',
    canActivate: [authGuard],
    loadComponent: () => import('./courses/certificates/certificates').then((m) => m.Certificates),
  },
  {
    // one certificate, ready to print
    path: 'certificates/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./courses/certificate-view/certificate-view').then((m) => m.CertificateView),
  },
  {
    // the user's own account: photo, name, password
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./profile/profile').then((m) => m.ProfilePage),
  },
  {
    // the user's notifications (students and teachers)
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () => import('./notifications/notifications').then((m) => m.Notifications),
  },
  {
    // one course: its details and its lessons
    path: 'courses/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./courses/course-details/course-details').then((m) => m.CourseDetailsPage),
  },
  {
    // the teacher area: where a teacher lands after login
    path: 'teacher',
    canActivate: [authGuard],
    loadComponent: () => import('./teacher/teacher-home').then((m) => m.TeacherHome),
  },
  {
    // a teacher opens a new course
    path: 'teacher/courses/new',
    canActivate: [authGuard],
    loadComponent: () => import('./teacher/course-form/course-form').then((m) => m.CourseForm),
  },
  {
    // a teacher changes a course he already has (same form as a new course)
    path: 'teacher/courses/:id/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./teacher/course-form/course-form').then((m) => m.CourseForm),
  },
  {
    // the students who joined one of his courses
    path: 'teacher/courses/:id/students',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./teacher/course-students/course-students').then((m) => m.CourseStudents),
  },
  {
    // a teacher adds sections and lessons to his course
    path: 'teacher/courses/:id/content',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./teacher/course-content/course-content').then((m) => m.CourseContent),
  },
  {
    // a teacher builds the exams of his course
    path: 'teacher/courses/:id/exams',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./teacher/course-exams/course-exams').then((m) => m.CourseExams),
  },
  {
    // the admin area: where an admin lands after login
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./admin/admin-home').then((m) => m.AdminHome),
  },
  {
    // one lesson: its video, its file, or its written text
    path: 'courses/:courseId/lessons/:lessonId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./courses/lesson-page/lesson-page').then((m) => m.LessonPage),
  },
  {
    // one exam: answer its questions and see the score
    path: 'courses/:courseId/quizzes/:quizId',
    canActivate: [authGuard],
    loadComponent: () => import('./courses/quiz-page/quiz-page').then((m) => m.QuizPage),
  },
  // the old home page is gone; its address now goes to the page for your role
  { path: 'home', pathMatch: 'full', redirectTo: homePage },
  { path: '**', redirectTo: homePage },
];
