
import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { PushService } from './services/push.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {

  constructor(
    private router: Router,
    private pushService: PushService
  ) {

    this.verificarLogin();

    this.pushService.iniciarNotificacoes();

  }

  verificarLogin() {

    const logado = localStorage.getItem('cuidadorLogado');

    if (logado === 'true') {
      this.router.navigate(['/tabs/home']);
    } else {
      this.router.navigate(['/primeirapg']);
    }

  }
}
