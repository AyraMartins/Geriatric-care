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
  CategoryScale,
  Legend,
  Tooltip
} from 'chart.js';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip
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
    this.aplicarTemaSalvo();

    const id = localStorage.getItem('cd_paciente');
    if (!id) return;

    this.cdPaciente = Number(id);

    this.buscarDadosPessoa();
    this.buscarResumoDiario();
    this.buscarGraficoDia();
    this.buscarGraficoSemana();
  }

  private aplicarTemaSalvo() {

  const tema = localStorage.getItem('modoEscuro');

  if (tema === 'true') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

  // =========================
  // PACIENTE
  // =========================
  buscarDadosPessoa() {
    this.http.get<any>(`http://localhost:5000/paciente-info/${this.cdPaciente}`)
      .subscribe(res => {
        const data = Array.isArray(res) ? res[0] : res;
        this.nomePaciente = data?.nm_paciente ?? '-';
        this.nomeCuidador = data?.nm_cuidador ?? '-';
      });
  }

  buscarResumoDiario() {
    this.http.get<any>(`http://localhost:5000/resumo-diario/${this.cdPaciente}`)
      .subscribe(res => {
        this.resumoDiario = Array.isArray(res) ? res : (res?.data ?? []);
      });
  }

  // =========================
  // TEMA DINÂMICO (IMPORTANTE)
  // =========================
private tema() {
  const dark = document.body.classList.contains('dark');

  return {
    text: dark ? '#ffffff' : '#5a5a5a',   // 👈 melhor legibilidade no claro
    grid: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
  };
}

  // =========================
  // GRÁFICO DIA
  // =========================
  buscarGraficoDia() {

    this.http.get<any>(`http://localhost:5000/grafico-dia/${this.cdPaciente}`)
      .subscribe(res => {

        const data = Array.isArray(res) ? res : (res?.data ?? []);

        const labels = data.map((x: any) => `${x.hora}h`);
        const medias = data.map((x: any) => x.media);

        this.criarGraficoDia(labels, medias);
      });
  }

  criarGraficoDia(labels: any[], medias: any[]) {

    const t = this.tema();

    this.graficoDia = new Chart('graficoDia', {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: medias,
          borderColor: '#ff4d4d',
          pointBackgroundColor: '#ff4d4d',
          borderWidth: 2,
          fill: false
        }]
      },
     options: {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Hora'
      },
      ticks: {
        color: t.text   // ✔ agora dinâmico
      },
      grid: {
        color: t.grid
      }
    },
    y: {
      title: {
        display: true,
        text: 'BPM (Média)'
      },
      ticks: {
        color: t.text   // ✔ agora dinâmico
      },
      grid: {
        color: t.grid
      }
    }
  }
}
    });
  }

  // =========================
  // GRÁFICO SEMANA
  // =========================
  buscarGraficoSemana() {

    this.http.get<any>(`http://localhost:5000/grafico-semana/${this.cdPaciente}`)
      .subscribe(res => {

        const data = Array.isArray(res) ? res : (res?.data ?? []);

        const labels = data.map((x: any) => x.dia);
        const medias = data.map((x: any) => x.media);

        this.criarGraficoSemana(labels, medias);
      });
  }

  criarGraficoSemana(labels: any[], medias: any[]) {

    const t = this.tema();

    this.graficoSemana = new Chart('graficoSemana', {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: medias,
          borderColor: '#ff4d4d',
          pointBackgroundColor: '#ff4d4d',
          borderWidth: 2,
          fill: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Dia'
            },
            ticks: {
              color: t.text
            },
            grid: {
              color: t.grid
            }
          },
          y: {
            title: {
              display: true,
              text: 'BPM (Média)'
            },
            ticks: {
              color: t.text
            },
            grid: {
              color: t.grid
            }
          }
        }
      }
    });
  }

  // =========================
  // PDF (SEM TEMA DA TELA)
  // =========================
  baixarPDF() {

    if (!this.cdPaciente) return;

    this.http.get<any>(`http://localhost:5000/resumo-pdf/${this.cdPaciente}`)
      .subscribe(res => {

        const dados = Array.isArray(res) ? res : (res?.dados ?? []);

        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text('Relatório BPM', 14, 15);

        autoTable(doc, {
          startY: 25,
          headStyles: {
            fillColor: [255, 77, 77],
            textColor: 255
          },
          head: [['Data', 'Média', 'Máx', 'Mín']],
          body: dados.map((i: any) => [
            i.data ?? '-',
            i.media ?? '-',
            i.maximo ?? '-',
            i.minimo ?? '-'
          ])
        });

        let y = (doc as any).lastAutoTable.finalY + 15;

        setTimeout(() => {

          const c1 = document.getElementById('graficoDia') as HTMLCanvasElement;

          if (c1) {
            doc.text('Gráfico Diário', 14, y);
            doc.addImage(c1.toDataURL('image/png'), 'PNG', 15, y + 5, 180, 70);
            y += 90;
          }

          const c2 = document.getElementById('graficoSemana') as HTMLCanvasElement;

          if (c2) {
            doc.text('Gráfico Semanal', 14, y);
            doc.addImage(c2.toDataURL('image/png'), 'PNG', 15, y + 5, 180, 70);
          }

          doc.save('relatorio-bpm.pdf');

        }, 400);
      });
  }

// =========================
// ENVIAR EMAIL MÉDICOS
// =========================
enviarMedicos() {

  const cd_paciente =
    localStorage.getItem('cd_paciente');

  this.http.post(

    `http://localhost:5000/enviar-medicos/${cd_paciente}`,

    {}

  ).subscribe({

    next: (res: any) => {

      console.log(res);

      alert(
        'Resumo enviado para os médicos'
      );
    },

    error: (err) => {

      console.log(err);

      alert(
        'Erro ao enviar email'
      );
    }
  });
}

}