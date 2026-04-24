import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class HomePage implements OnInit {

  bpm: number = 0;

  constructor() {}

buscarBpm() {
  fetch('http://192.168.0.51/bpm', { mode: 'no-cors' })
    .then(res => res.text())
    .then(valor => {
      const numero = parseInt(valor);
      if (!isNaN(numero)) {
        this.bpm = numero;
      }
    })
    .catch(err => {
      console.error('Erro:', err);
    });
}

  ngOnInit() {
    setInterval(() => {
      this.buscarBpm();
    }, 2000); // a cada 2 segundos
  }
}