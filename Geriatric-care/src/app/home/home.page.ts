import { ApplicationRef, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { BpmService } from '../services/bpm';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class HomePage implements OnInit, OnDestroy {

  bpm: number | null = null;
  mediaDiaria: number | null = null;
  maximoHoje: number | null = null;
  minimoHoje: number | null = null;
  cdPaciente = 1;
  private subscription = new Subscription();

  constructor(
    private bpmService: BpmService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private appRef: ApplicationRef
  ) {
    console.log('HOME CRIADA');
  }

  ngOnInit() {
    console.log('HOME ngOnInit');
    this.buscarResumoDiario();
    this.subscription.add(
      this.bpmService.bpm$.subscribe(value => {
        console.log('HOME BPM VALUE:', value, 'ZONE:', NgZone.isInAngularZone());
        this.bpm = value;
        setTimeout(() => {
          this.cdr.detectChanges();
          this.appRef.tick();
          const manual = document.getElementById('debug-bpm-manual');
          const display = document.getElementById('display-bpm');
          const debugValue = document.getElementById('debug-bpm-value');
          const debugStatic = document.getElementById('debug-bpm');
          if (manual) {
            manual.innerText = `MANUAL DEBUG bpm = ${value}`;
          }
          if (display) {
            display.innerText = `${value}`;
          }
          if (debugValue) {
            debugValue.innerText = `DEBUG: bpm = ${value}`;
          }
          if (debugStatic) {
            debugStatic.innerText = `STATIC DEBUG VISIBLE: bpm = ${value} | JSON = ${JSON.stringify(value)} | SHOW = true`;
          }
        }, 0);
      })
    );
  }

  buscarResumoDiario() {
    this.http.get<any[]>(`http://localhost:5000/resumo-diario/${this.cdPaciente}`)
      .subscribe(res => {
        if (!res?.length) {
          return;
        }

        const maiorDataResumo = [...res].sort((a, b) => {
          const dataA = new Date(a.data).getTime();
          const dataB = new Date(b.data).getTime();
          return dataB - dataA;
        })[0];

        this.mediaDiaria = maiorDataResumo.media ?? null;
        this.maximoHoje = maiorDataResumo.maximo ?? null;
        this.minimoHoje = maiorDataResumo.minimo ?? null;
      });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
