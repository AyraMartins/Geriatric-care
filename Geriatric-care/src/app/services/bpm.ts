import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, timer, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BpmService {

  private bpmSubject = new BehaviorSubject<number | null>(null);
  bpm$ = this.bpmSubject.asObservable();

  constructor(private http: HttpClient) {

    timer(0, 3000)
      .pipe(
        switchMap(() =>
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
        }
      });

  }
}