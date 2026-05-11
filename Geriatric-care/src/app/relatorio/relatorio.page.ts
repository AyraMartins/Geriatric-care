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
  imports: [IonicModule, CommonModule]
})
export class RelatorioPage implements OnInit {

  resumoDiario: any[] = [];
  graficoDia: any;
  graficoSemana: any;

  cdPaciente: number | null = null;

  nomePaciente: string = '';
  nomeCuidador: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {

    const cdPaciente = localStorage.getItem('cd_paciente');

    if (!cdPaciente) {
      console.log('SEM PACIENTE NO LOCALSTORAGE');
      return;
    }

    this.cdPaciente = Number(cdPaciente);

    this.buscarDadosPessoa();
    this.buscarResumoDiario();
    this.buscarGraficoDia();
    this.buscarGraficoSemana();
  }

  // -----------------------------
  // PACIENTE + CUIDADOR
  // -----------------------------
  buscarDadosPessoa() {

    this.http.get<any>(
      `http://localhost:5000/paciente-info/${this.cdPaciente}`
    ).subscribe(res => {

      const data = Array.isArray(res) ? res[0] : res;

      this.nomePaciente = data?.nm_paciente ?? 'Não informado';
      this.nomeCuidador = data?.nm_cuidador ?? 'Não informado';

    });
  }

  // -----------------------------
  // RESUMO
  // -----------------------------
  buscarResumoDiario() {

    this.http.get<any>(
      `http://localhost:5000/resumo-diario/${this.cdPaciente}`
    ).subscribe(res => {

      this.resumoDiario = Array.isArray(res)
        ? res
        : (res?.data ?? []);

    });
  }

  // -----------------------------
  // GRAFICO DIA
  // -----------------------------
  buscarGraficoDia() {

    this.http.get<any>(
      `http://localhost:5000/grafico-dia/${this.cdPaciente}`
    ).subscribe(res => {

      const data = Array.isArray(res) ? res : (res?.data ?? []);

      const labels = data.map((x: any) => x.hora + ':00');
      const medias = data.map((x: any) => x.media);

      this.criarGraficoDia(labels, medias);
    });
  }

  // -----------------------------
  // GRAFICO SEMANA
  // -----------------------------
  buscarGraficoSemana() {

    this.http.get<any>(
      `http://localhost:5000/grafico-semana/${this.cdPaciente}`
    ).subscribe(res => {

      const data = Array.isArray(res) ? res : (res?.data ?? []);

      const labels = data.map((x: any) => x.dia);
      const medias = data.map((x: any) => x.media);

      this.criarGraficoSemana(labels, medias);
    });
  }

  // -----------------------------
  criarGraficoDia(labels: any[], medias: any[]) {

    this.graficoDia = new Chart('graficoDia', {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Média BPM',
          data: medias,
          borderWidth: 2,
          borderColor: '#ff4d4d',
          pointBackgroundColor: '#ff4d4d',
          pointBorderColor: '#ff4d4d'
        }]
      }
    });
  }

  criarGraficoSemana(labels: any[], medias: any[]) {

    this.graficoSemana = new Chart('graficoSemana', {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Média Semanal BPM',
          data: medias,
          borderWidth: 2,
          borderColor: '#ff4d4d',
          pointBackgroundColor: '#ff4d4d',
          pointBorderColor: '#ff4d4d'
        }]
      }
    });
  }

  // -----------------------------
  // PDF
  // -----------------------------
baixarPDF() {

  if (!this.cdPaciente) return;

  this.http.get<any>(
    `http://localhost:5000/resumo-pdf/${this.cdPaciente}`
  ).subscribe(res => {

    // ✅ GARANTE ARRAY MESMO SE VIER {dados:[]}
    const dados = Array.isArray(res)
      ? res
      : (res?.dados ?? []);

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Relatório BPM', 14, 15);

    // -----------------------------
    // TABELA (AGORA CORRETA)
    // -----------------------------
    autoTable(doc, {
      startY: 25,
      head: [['Data', 'Média', 'Máx', 'Mín']],
      body: dados.map((item: any) => [
        item.data ?? '-',
        item.media ?? '-',
        item.maximo ?? '-',
        item.minimo ?? '-'
      ])
    });

    let finalY = (doc as any).lastAutoTable.finalY + 15;

    // -----------------------------
    // GRÁFICO DIA (COM DELAY)
    // -----------------------------
    setTimeout(() => {

      const canvasDia = document.getElementById('graficoDia') as HTMLCanvasElement;

      if (canvasDia) {
        const imgDia = canvasDia.toDataURL('image/png');

        doc.text('Gráfico Diário', 14, finalY);
        doc.addImage(imgDia, 'PNG', 15, finalY + 5, 180, 70);

        finalY += 90;
      }

      // -----------------------------
      // GRÁFICO SEMANA
      // -----------------------------
      const canvasSemana = document.getElementById('graficoSemana') as HTMLCanvasElement;

      if (canvasSemana) {
        const imgSemana = canvasSemana.toDataURL('image/png');

        doc.text('Gráfico Semanal', 14, finalY);
        doc.addImage(imgSemana, 'PNG', 15, finalY + 5, 180, 70);
      }

      doc.save('relatorio.pdf');

    }, 500); // ⬅ importante para o Chart renderizar

  });
}
}