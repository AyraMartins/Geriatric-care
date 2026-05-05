import { Routes } from '@angular/router';
import { OnboardingGuard } from './guards/onboarding-guard';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },

  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.page').then(m => m.HomePage),
  },

  {
    path: 'primeirapg',
    loadComponent: () =>
      import('./primeirapg/primeirapg.page').then(m => m.PrimeiraPgPage),
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.page').then(m => m.LoginPage),
  },

  {
    path: 'cadastro-paciente',
    loadComponent: () =>
      import('./cadastro-paciente/cadastro-paciente.page')
        .then(m => m.CadastroPacientePage),
  }

];
