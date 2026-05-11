import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale
} from 'chart.js';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale
);

@Component({
  selector: 'app-relatorio',
  templateUrl: './relatorio.page.html',
  styleUrls: ['./relatorio.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule
  ]
})
export class RelatorioPage implements OnInit {

  resumoDiario: any[] = [];

  graficoDia: any;
  graficoSemana: any;

  // paciente fixo temporário
  cdPaciente = 3;

  constructor(private http: HttpClient) {}

  ngOnInit() {

    this.buscarResumoDiario();

    this.buscarGraficoDia();

    this.buscarGraficoSemana();
  }

  // ------------------------------------------------
  // RESUMO DIÁRIO
  // ------------------------------------------------
  buscarResumoDiario() {

    this.http.get<any[]>(
      `http://localhost:5000/resumo-diario/${this.cdPaciente}`
    )
    .subscribe(res => {

      console.log(res);

      this.resumoDiario = res;
    });
  }

  // ------------------------------------------------
  // GRAFICO DIA
  // ------------------------------------------------
  buscarGraficoDia() {

    this.http.get<any[]>(
      `http://localhost:5000/grafico-dia/${this.cdPaciente}`
    )
    .subscribe(res => {

      const labels = res.map(x => x.hora + ':00');

      const medias = res.map(x => x.media);

      this.criarGraficoDia(labels, medias);
    });
  }

 // ------------------------------------------------
// GRAFICO SEMANA
// ------------------------------------------------
buscarGraficoSemana() {

  this.http.get<any[]>(
    `http://localhost:5000/grafico-semana/${this.cdPaciente}`
  )
  .subscribe(res => {

    console.log(res);

    const labels = res.map(x => x.dia);

    const medias = res.map(x => x.media);

    this.criarGraficoSemana(labels, medias);
  });
}
  // ------------------------------------------------
  // CRIAR GRAFICO DIA
  // ------------------------------------------------
  criarGraficoDia(labels: any[], medias: any[]) {

    this.graficoDia = new Chart('graficoDia', {

      type: 'line',

      data: {

        labels: labels,

        datasets: [

          {
            label: 'Média BPM',

            data: medias,

            borderWidth: 2,
            
            borderColor: '#ff4d4d',

            pointBackgroundColor: '#ff4d4d',
            
            pointBorderColor: '#ff4d4d'
            
          }

        ]
      }
    });
  }

  // ------------------------------------------------
  // CRIAR GRAFICO SEMANA
  // ------------------------------------------------
  criarGraficoSemana(labels: any[], medias: any[]) {

    this.graficoSemana = new Chart('graficoSemana', {

      type: 'line',

      data: {

        labels: labels,

        datasets: [

          {
            label: 'Média Semanal BPM',

            data: medias,

            borderWidth: 2,

            borderColor: '#ff4d4d',

            pointBackgroundColor: '#ff4d4d',
            
            pointBorderColor: '#ff4d4d'
          }

        ]
      }
    });
  }

  // ------------------------------------------------
  // PDF
  // ------------------------------------------------
  baixarPDF() {

    const doc = new jsPDF();

    doc.text('Relatório BPM', 10, 10);

    autoTable(doc, {

      head: [['Data', 'Média', 'Máx', 'Mín']],

      body: this.resumoDiario.map(item => [

        item.data,

        item.media,

        item.maximo,

        item.minimo

      ])
    });

    doc.save('relatorio.pdf');
  }
}