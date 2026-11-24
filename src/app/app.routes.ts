import { Routes } from '@angular/router';
import { LayOut } from './Instractor/components/lay-out/lay-out';

export const routes: Routes = [
  {
    path: 'instractor',
    component: LayOut,
    children: [

        {   
        path: '',
        loadComponent: () => import('./Instractor/components/dashboared/dashboared').then(m => m.Dashboared)
      },
      {   
        path: 'create-course',
        loadComponent: () => import('./Instractor/components/creat-course/creat-course').then(m => m.CreateCourse)
      },
      {   
        path: 'update-course/:id',
        loadComponent: () => import('./Instractor/components/creat-course/creat-course').then(m => m.CreateCourse)
      },
      {
        path: 'my-courses',
        loadComponent: () => import('./Instractor/components/my-courses/my-courses').then(m => m.InstructorCourses)
      },
       {
        path: 'creat-exam/:courseId/:sectionId/:lessonId',
        loadComponent: () => import('./Instractor/components/creat-exam/creat-exam').then(m => m.CreatExamenation)
      },
       {
        path: 'quizzes/:quizId/edit',
        loadComponent: () => import('./Instractor/components/creat-exam/creat-exam').then(m => m.CreatExamenation)
      },
       {
        path: 'insQuizzes',
        loadComponent: () => import('./Instractor/components/exams/quizes').then(m => m.MyQuizzes)
      },
       {
        path: 'insQuizzes/:quizId',
        loadComponent: () => import('./Instractor/components/quiz-details/quiz-details').then(m => m.QuizDetails)
      },
        {
        path: 'quizzes/:quizId/questions',
        loadComponent: () => import('./Instractor/components/add-questions/add-questions').then(m => m.QuizQuestionsManagement)
      },
      {
        path: 'quizzes/:quizId/update-question/:questionId',
        loadComponent: () => import('./Instractor/components/add-questions/add-questions').then(m => m.QuizQuestionsManagement)
      },
      {
        path: 'settings',
        loadComponent: () => import('./Instractor/components/settings/settings').then(m => m.Settings)
      },
        {
        path: 'lesson-management/:sectionId',
        loadComponent: () => import('./Instractor/components/add-lesson/add-lesson').then(m => m.LessonManagementComponent)
      },
      {
    path: 'courses-content/:id',
    loadComponent: () => import('./Main/components/course-layout/course-layout').then(m => m.CourseLayout),
    children: [
      {
        path: '', // المسار الافتراضي (بيعرض هيدر الكورس وتفاصيله)
        loadComponent: () => import('./Main/components/course-content/course-content').then(m => m.CourseHeader)
      },
      {
        path: 'lesson/:courseId/:lessonId',
        loadComponent: () => import('./Main/components/lesson-displaying/lesson-displaying').then(m => m.LessonViewer)
      }
    ]
      },
        
    ]
  },
  
   
];