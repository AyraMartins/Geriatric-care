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
    fetch('http://192.168.0.132:5000/')
      .then(res => res.json())
      .then(data => {

        console.log("DATA:", data);

        if (data && typeof data.bpm === 'number') {
          this.bpm = data.bpm;
        }

      })
      .catch(err => console.error(err));
  }

  ngOnInit() {
    this.buscarBpm();

    setInterval(() => {
      this.buscarBpm();
    }, 2000);
  }
}