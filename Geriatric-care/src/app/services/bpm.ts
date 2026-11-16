
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, timer, of } from 'rxjs';
import { exhaustMap, catchError, tap } from 'rxjs/operators';
import { NotificacaoService } from './notificacao.service';

@Injectable({
  providedIn: 'root'
})
export class BpmService {

  private bpmSubject = new BehaviorSubject<number | null>(null);
  bpm$ = this.bpmSubject.asObservable();

  private alertaAtivo = false;

  constructor(
    private http: HttpClient,
    private notificacaoService: NotificacaoService
  ) {

    this.notificacaoService.solicitarPermissao();

    timer(0, 5000)
      .pipe(
        exhaustMap(() =>
          this.http.get<any>('https://geriatric-care.onrender.com').pipe(
            tap(data => console.log('SERVICE BPM RESPONSE:', data)),
            catchError(error => {
              console.error('SERVICE BPM ERROR:', error);
              return of(null);
            })
          )
        )
      )
      .subscribe(data => {

        if (data?.bpm != null) {

          const bpm = Number(data.bpm);

          console.log('SERVICE BPM NEXT:', bpm);

          this.bpmSubject.next(bpm);

          if (bpm >= 100 && !this.alertaAtivo) {

            this.alertaAtivo = true;

            this.notificacaoService.enviarAlerta(bpm);

          }

          if (bpm < 100) {
            this.alertaAtivo = false;
          }

        }

      });

  }
}
