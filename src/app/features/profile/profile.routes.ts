import { Routes } from '@angular/router';
import { ProfileComponent } from './pages/profile/profile.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':username',
        component: ProfileComponent,
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/profile-articles.page'),
          },
          {
            path: 'favorites',
            loadComponent: () => import('./pages/profile-articles.page'),
            data: { favorites: true },
          },
        ],
      },
    ],
  },
];

export default routes;
