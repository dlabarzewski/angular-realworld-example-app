import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from './core/auth/services/user.service';
import { map } from 'rxjs/operators';
import { AuthType } from './core/auth/statics/auth-type.enum';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/article/pages/home/home.page'),
  },
  {
    path: 'login',
    loadComponent: () => import('./core/auth/pages/auth.page'),
    canActivate: [() => inject(UserService).isAuthenticated.pipe(map(isAuth => !isAuth))],
    data: { authType: AuthType.LOGIN },
  },
  {
    path: 'register',
    loadComponent: () => import('./core/auth/pages/auth.page'),
    canActivate: [() => inject(UserService).isAuthenticated.pipe(map(isAuth => !isAuth))],
    data: { authType: AuthType.REGISTER },
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/pages/settings.page'),
    canActivate: [() => inject(UserService).isAuthenticated],
  },
  {
    path: 'profile',
    loadChildren: () => import('./features/profile/profile.routes'),
  },
  {
    path: 'editor',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/article/pages/editor/editor.page'),
        canActivate: [() => inject(UserService).isAuthenticated],
      },
      {
        path: ':slug',
        loadComponent: () => import('./features/article/pages/editor/editor.page'),
        canActivate: [() => inject(UserService).isAuthenticated],
      },
    ],
  },
  {
    path: 'article/:slug',
    loadComponent: () => import('./features/article/pages/article/article.page'),
  },
];
