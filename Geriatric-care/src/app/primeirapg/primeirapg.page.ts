import { Component, OnInit } from '@angular/core';
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
export class PrimeiraPgPage implements OnInit {

  pagina = 1;

  constructor(private router: Router) {}

  ngOnInit() {
  const logado = localStorage.getItem('cuidadorLogado');

  if (logado === 'true') {
    setTimeout(() => {
      this.router.navigateByUrl('/tabs/home', { replaceUrl: true });
    }, 50);
  }
}


  proximo() {
    if (this.pagina < 3) this.pagina++;
  }

  voltar() {
    if (this.pagina > 1) this.pagina--;
  }

  irParaLogin() {
  localStorage.setItem('onboardingVisto', 'true');
  this.router.navigate(['/login']);
}
}