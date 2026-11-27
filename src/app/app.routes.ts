import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

// Which URL shows which page. loadComponent = lazy loading:
// a page's code is downloaded only when someone opens it.
export const routes: Routes = [
  // The courses page is the first thing a student sees.
  { path: '', pathMatch: 'full', redirectTo: 'courses' },
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
    // one course: its details and its lessons
    path: 'courses/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./courses/course-details/course-details').then((m) => m.CourseDetailsPage),
  },
  // the old home page is gone; its address now opens the courses page
  { path: 'home', pathMatch: 'full', redirectTo: 'courses' },
  { path: '**', redirectTo: 'courses' },
];
