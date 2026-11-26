import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

// Which URL shows which page. loadComponent = lazy loading:
// a page's code is downloaded only when someone opens it.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
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
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./home/home').then((m) => m.Home),
  },
  { path: '**', redirectTo: 'login' },
];
