import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class HomePage {

  bpm: number | null = null;
  sub!: Subscription;

  constructor(private http: HttpClient) {}

  buscarBpm() {
    this.http.get<any>('http://10.123.229.18:5000/')
      .subscribe(data => {

        console.log("DATA:", data);

        const novoBpm = Number(data.bpm);

        if (!isNaN(novoBpm) && novoBpm > 0) {
          this.bpm = novoBpm;
        }

      }, err => console.error(err));
  }

  // 👇 Ionic chama automaticamente
  ionViewWillEnter() {
    console.log("ENTROU NA TELA");

    this.buscarBpm();

    this.sub = interval(3000).subscribe(() => {
      this.buscarBpm();
    });
  }

  // 👇 Ionic chama automaticamente
  ionViewWillLeave() {
    console.log("SAIU DA TELA");

    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}