import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {

  constructor(private router: Router) {
    this.verificarLogin();
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