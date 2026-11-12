
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  BehaviorSubject,
  timer,
  EMPTY
} from 'rxjs';

import {
  exhaustMap,
  catchError,
  distinctUntilChanged
} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BpmService {

  private readonly API =
    'https://geriatric-care.onrender.com';

  private bpmSubject =
    new BehaviorSubject<number | null>(null);

  bpm$ = this.bpmSubject.asObservable();

  constructor(private http: HttpClient) {

    console.log('BPM SERVICE INICIADO');

    // Reduz a frequencia de requisicoes para evitar respostas 429.
    timer(0, 30000)
      .pipe(

        // Evita consultas simultaneas
        exhaustMap(() => {

          return this.http.get<{ bpm: number | null }>(
            this.API
          ).pipe(

            catchError(error => {

              if (error.status === 429) {

                console.warn(
                  'Render limitou as requisicoes (429).'
                );

              } else {

                console.error(
                  'ERRO AO CONSULTAR BPM:',
                  error
                );

              }

              // Mantem o ultimo BPM em caso de erro
              return EMPTY;
            })

          );

        })

      )
      .subscribe(data => {

        console.log('RESPOSTA DO SERVIDOR:', data);

        if (data && data.bpm === null) {

          this.bpmSubject.next(null);

          return;
        }

        if (data && data.bpm != null) {

          const bpm = Number(data.bpm);

          if (Number.isFinite(bpm) && bpm > 0) {

            console.log('BPM ATUALIZADO:', bpm);

            this.bpmSubject.next(bpm);
          }

        }

      });

  }

}
