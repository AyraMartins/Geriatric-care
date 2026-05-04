import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-primeirapg',
  templateUrl: './primeirapg.page.html',
  styleUrls: ['./primeirapg.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class PrimeiraPgPage {

  pagina = 1;

  constructor(private router: Router) {}

  proximo() {
    if (this.pagina < 3) this.pagina++;
  }

  voltar() {
    if (this.pagina > 1) this.pagina--;
  }

  irParaLogin() {
    this.router.navigate(['/login']);
  }
}