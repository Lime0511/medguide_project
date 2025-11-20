import { Routes } from '@angular/router';
import { authGuard } from './guard/auth.guard';
import { MainPage } from './main/main.page';
import { guestGuard } from './guard/guest.guard';

export const routes: Routes = [
  // PUBLIC ROUTES (NO GUARD)
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/register/register.page').then(m => m.RegisterPage)
  },

  // PROTECTED APP SHELL
  {
    path: '',
    component: MainPage,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then(m => m.HomePage)
      },
      {
        path: 'reminders',
        loadComponent: () => import('./reminders/reminders.page').then(m => m.RemindersPage)
      },

      {
        path: 'timeline',
        loadComponent: () =>
          import('./timeline/timeline.page').then(m => m.TimelinePage)
      },
    
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings.page').then(m => m.SettingsPage)
      },

      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.page').then(m => m.ProfilePage)
      },



      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  },

  // FALLBACK
  { path: '**', redirectTo: 'login' }
];
