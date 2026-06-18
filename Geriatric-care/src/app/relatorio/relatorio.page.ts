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
    this.http.get<any>(`https://geriatric-care.onrender.com/paciente-info/${this.cdPaciente}`)
      .subscribe(res => {
        const data = Array.isArray(res) ? res[0] : res;
        this.nomePaciente = data?.nm_paciente ?? '-';
        this.nomeCuidador = data?.nm_cuidador ?? '-';
      });
  }

  buscarResumoDiario() {
    this.http.get<any>(`https://geriatric-care.onrender.com/resumo-diario/${this.cdPaciente}`)
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

    this.http.get<any>(`https://geriatric-care.onrender.com/grafico-dia/${this.cdPaciente}`)
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

    this.http.get<any>(`https://geriatric-care.onrender.com/grafico-semana/${this.cdPaciente}`)
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
// PDF
// =========================
baixarPDF() {

  if (!this.cdPaciente) return;

  this.http.get<any>(
    `https://geriatric-care.onrender.com/resumo-pdf/${this.cdPaciente}`
  ).subscribe(res => {

    console.log(res);

    // -------------------------
    // DADOS
    // -------------------------
    const dados = res?.dados ?? [];

    const paciente =
      res?.paciente ?? '-';

    const cuidador =
      res?.cuidador ?? '-';

    // -------------------------
    // PDF
    // -------------------------
    const doc = new jsPDF();

    doc.setFontSize(20);

    doc.text(
      'Relatório BPM',
      14,
      20
    );

    doc.setFontSize(12);

    doc.text(
      `Paciente: ${paciente}`,
      14,
      35
    );

    doc.text(
      `Cuidador: ${cuidador}`,
      14,
      45
    );

    // -------------------------
    // TABELA
    // -------------------------
    autoTable(doc, {

      startY: 55,

      styles: {
        fontSize: 11,
        cellPadding: 4
      },

      headStyles: {
        fillColor: [255, 77, 77],
        textColor: 255,
        fontSize: 12
      },

      head: [[
        'Data',
        'Média',
        'Máximo',
        'Mínimo'
      ]],

      body: dados.map((i: any) => [

        i.data ?? '-',

        i.media ?? '-',

        i.maximo ?? '-',

        i.minimo ?? '-'

      ])
    });

    // -------------------------
    // POSIÇÃO Y
    // -------------------------
    let y =
      (doc as any)
      .lastAutoTable
      .finalY + 20;


// ==========================
// FORÇAR CORES PDF
// ==========================
    this.graficoDia.options.scales.x.ticks.color = '#000';
    this.graficoDia.options.scales.y.ticks.color = '#000';

    this.graficoSemana.options.scales.x.ticks.color = '#000';
    this.graficoSemana.options.scales.y.ticks.color = '#000';

    this.graficoDia.options.scales.x.title.color = '#000';
    this.graficoDia.options.scales.y.title.color = '#000';

    this.graficoSemana.options.scales.x.title.color = '#000';
    this.graficoSemana.options.scales.y.title.color = '#000';

    this.graficoDia.update();
    this.graficoSemana.update();
    // -------------------------
    // AGUARDAR GRÁFICOS
    // -------------------------
    setTimeout(() => {

      // -------------------------
      // GRÁFICO DIA
      // -------------------------
      const c1 =
        document.getElementById(
          'graficoDia'
        ) as HTMLCanvasElement;

      if (c1) {

        doc.setFontSize(14);

        doc.text(
          'Gráfico Diário',
          14,
          y
        );

        doc.addImage(
          c1.toDataURL('image/png'),
          'PNG',
          15,
          y + 5,
          180,
          80
        );

        y += 100;
      }

      // -------------------------
      // NOVA PÁGINA
      // -------------------------
      if (y > 220) {

        doc.addPage();

        y = 20;
      }

      // -------------------------
      // GRÁFICO SEMANA
      // -------------------------
      const c2 =
        document.getElementById(
          'graficoSemana'
        ) as HTMLCanvasElement;

      if (c2) {

        doc.setFontSize(14);

        doc.text(
          'Gráfico Semanal',
          14,
          y
        );

        doc.addImage(
          c2.toDataURL('image/png'),
          'PNG',
          15,
          y + 5,
          180,
          80
        );
      }

      // -------------------------
      // SALVAR
      // -------------------------
      doc.save(
        'relatorio-bpm.pdf'
      );

// ==========================
// RESTAURAR TEMA
// ==========================
const t = this.tema();

this.graficoDia.options.scales.x.ticks.color = t.text;
this.graficoDia.options.scales.y.ticks.color = t.text;

this.graficoSemana.options.scales.x.ticks.color = t.text;
this.graficoSemana.options.scales.y.ticks.color = t.text;

this.graficoDia.options.scales.x.title.color = t.text;
this.graficoDia.options.scales.y.title.color = t.text;

this.graficoSemana.options.scales.x.title.color = t.text;
this.graficoSemana.options.scales.y.title.color = t.text;

this.graficoDia.update();
this.graficoSemana.update();

    }, 500);
  });
}

// =========================
// ENVIAR EMAIL MÉDICOS
// =========================
enviarMedicos() {

  if (!this.cdPaciente) return;

  this.http.get<any>(
    `https://geriatric-care.onrender.com/resumo-pdf/${this.cdPaciente}`
  ).subscribe(res => {

    const dados = res?.dados ?? [];

    const paciente =
      res?.paciente ?? '-';

    const cuidador =
      res?.cuidador ?? '-';

    // -------------------------
    // PDF
    // -------------------------
    const doc = new jsPDF();

    doc.setFontSize(20);

    doc.text(
      'Relatório BPM',
      14,
      20
    );

    doc.setFontSize(12);

    doc.text(
      `Paciente: ${paciente}`,
      14,
      35
    );

    doc.text(
      `Cuidador: ${cuidador}`,
      14,
      45
    );

    // -------------------------
    // TABELA
    // -------------------------
    autoTable(doc, {

      startY: 55,

      styles: {
        fontSize: 11,
        cellPadding: 4
      },

      headStyles: {
        fillColor: [255, 77, 77],
        textColor: 255,
        fontSize: 12
      },

      head: [[
        'Data',
        'Média',
        'Máximo',
        'Mínimo'
      ]],

      body: dados.map((i: any) => [

        i.data ?? '-',

        i.media ?? '-',

        i.maximo ?? '-',

        i.minimo ?? '-'

      ])
    });

    let y =
      (doc as any)
      .lastAutoTable
      .finalY + 20;

      // ==========================
// FORÇAR CORES PDF
// ==========================
this.graficoDia.options.scales.x.ticks.color = '#000';
this.graficoDia.options.scales.y.ticks.color = '#000';

this.graficoSemana.options.scales.x.ticks.color = '#000';
this.graficoSemana.options.scales.y.ticks.color = '#000';

this.graficoDia.options.scales.x.title.color = '#000';
this.graficoDia.options.scales.y.title.color = '#000';

this.graficoSemana.options.scales.x.title.color = '#000';
this.graficoSemana.options.scales.y.title.color = '#000';

this.graficoDia.update();
this.graficoSemana.update();

    setTimeout(() => {

      // -------------------------
      // GRÁFICO DIA
      // -------------------------
      const c1 =
        document.getElementById(
          'graficoDia'
        ) as HTMLCanvasElement;

      if (c1) {

        doc.setFontSize(14);

        doc.text(
          'Gráfico Diário',
          14,
          y
        );

        doc.addImage(
          c1.toDataURL('image/png'),
          'PNG',
          15,
          y + 5,
          180,
          80
        );

        y += 100;
      }

      // -------------------------
      // NOVA PÁGINA
      // -------------------------
      if (y > 220) {

        doc.addPage();

        y = 20;
      }

      // -------------------------
      // GRÁFICO SEMANAL
      // -------------------------
      const c2 =
        document.getElementById(
          'graficoSemana'
        ) as HTMLCanvasElement;

      if (c2) {

        doc.setFontSize(14);

        doc.text(
          'Gráfico Semanal',
          14,
          y
        );

        doc.addImage(
          c2.toDataURL('image/png'),
          'PNG',
          15,
          y + 5,
          180,
          80
        );
      }

      // -------------------------
      // BASE64 PDF
      // -------------------------
      const pdfBase64 =
        doc.output('datauristring')
        .split(',')[1];

      // -------------------------
      // ENVIAR BACKEND
      // -------------------------
      this.http.post(

        `https://geriatric-care.onrender.com/enviar-medicos/${this.cdPaciente}`,

        {
          pdf_base64: pdfBase64
        }

      ).subscribe({

        next: (res: any) => {

          console.log(res);

          alert(
            'Resumo enviado para os médicos'
          );
// ==========================
// RESTAURAR TEMA
// ==========================
const t = this.tema();

this.graficoDia.options.scales.x.ticks.color = t.text;
this.graficoDia.options.scales.y.ticks.color = t.text;

this.graficoSemana.options.scales.x.ticks.color = t.text;
this.graficoSemana.options.scales.y.ticks.color = t.text;

this.graficoDia.options.scales.x.title.color = t.text;
this.graficoDia.options.scales.y.title.color = t.text;

this.graficoSemana.options.scales.x.title.color = t.text;
this.graficoSemana.options.scales.y.title.color = t.text;

this.graficoDia.update();
this.graficoSemana.update();

        },

        error: (err) => {

          console.log(err);

          alert(
            'Erro ao enviar email'
          );
        }
      });

    }, 500);
  });
}
}