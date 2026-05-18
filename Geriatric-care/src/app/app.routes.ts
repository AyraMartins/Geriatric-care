import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'primeirapg',
    pathMatch: 'full'
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
  },

  {
    path: 'tabs',
    loadComponent: () =>
      import('./tabs/tabs.page').then(m => m.TabsPage),

    children: [

      {
        path: 'home',
        loadComponent: () =>
          import('./home/home.page').then(m => m.HomePage),
      },

      {
        path: 'relatorio',
        loadComponent: () =>
          import('./relatorio/relatorio.page').then(m => m.RelatorioPage),
      },

      {
        path: 'configuracoes',
        loadComponent: () =>
          import('./configuracoes/configuracoes.page')
            .then(m => m.ConfiguracoesPage),
      },

      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }

    ]
  },

  {
    path: 'home',
    redirectTo: 'tabs/home',
    pathMatch: 'full'
  },

  {
    path: 'relatorio',
    redirectTo: 'tabs/relatorio',
    pathMatch: 'full'
  },

  {
    path: 'configuracoes',
    redirectTo: 'tabs/configuracoes',
    pathMatch: 'full'
  }

];