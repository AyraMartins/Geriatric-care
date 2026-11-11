import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  Filesystem,
  Directory
} from '@capacitor/filesystem';
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

interface TesteBasalRelatorio {
  cd_tipo: number;
  media_bpm: number | null;
}

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
  enviandoEmail = false;

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

  ionViewWillEnter() {
    this.aplicarTemaSalvo();
    this.atualizarTemaGraficos();
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

private atualizarTemaGraficos() {
  const tema = this.tema();

  [this.graficoDia, this.graficoSemana].forEach(grafico => {
    if (!grafico) return;

    for (const eixo of ['x', 'y']) {
      grafico.options.scales[eixo].ticks.color = tema.text;
      grafico.options.scales[eixo].title.color = tema.text;
      grafico.options.scales[eixo].grid.color = tema.grid;
    }

    grafico.update('none');
  });
}

private criarImagemGraficoPDF(grafico: any): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 400;

  const graficoPDF = new Chart(canvas, {
    type: 'line',
    data: {
      labels: [...(grafico.data.labels ?? [])],
      datasets: grafico.data.datasets.map((dataset: any) => ({
        ...dataset,
        data: [...dataset.data]
      }))
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: grafico.options.scales.x.title.text,
            color: '#000000'
          },
          ticks: { color: '#000000' },
          grid: { color: 'rgba(0, 0, 0, 0.12)' }
        },
        y: {
          title: {
            display: true,
            text: grafico.options.scales.y.title.text,
            color: '#000000'
          },
          ticks: { color: '#000000' },
          grid: { color: 'rgba(0, 0, 0, 0.12)' }
        }
      }
    },
    plugins: [{
      id: 'pdfWhiteBackground',
      beforeDraw(chart) {
        const context = chart.ctx;
        context.save();
        context.globalCompositeOperation = 'destination-over';
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, chart.width, chart.height);
        context.restore();
      }
    }]
  });

  try {
    return canvas.toDataURL('image/png');
  } finally {
    graficoPDF.destroy();
  }
}

private adicionarTabelaTestesBasais(
  doc: jsPDF,
  testesBasais: TesteBasalRelatorio[],
  startY: number
): number {
  if (testesBasais.length === 0) {
    return startY;
  }

  const tipos: Record<number, string> = {
    1: 'Repouso',
    2: 'Caminhada',
    3: 'Exercício intenso'
  };

  autoTable(doc, {
    startY,
    head: [['Teste basal', 'Média BPM']],
    body: testesBasais.map(teste => [
      tipos[teste.cd_tipo] ?? '-',
      teste.media_bpm ?? '-'
    ]),
    styles: {
      fontSize: 11,
      cellPadding: 4
    },
    headStyles: {
      fillColor: [255, 77, 77],
      textColor: [255, 255, 255],
      fontSize: 12
    }
  });

  return (doc as any).lastAutoTable.finalY + 10;
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
async baixarPDF() {

  if (!this.cdPaciente) return;

  this.http.get<any>(
    `https://geriatric-care.onrender.com/resumo-pdf/${this.cdPaciente}`
  ).subscribe(async (res) => {

    const dados = res?.dados ?? [];
    const paciente = res?.paciente ?? '-';
    const cuidador = res?.cuidador ?? '-';
    const testesBasais: TesteBasalRelatorio[] = res?.testes_basais ?? [];


    const doc = new jsPDF();

    // TÍTULO
    doc.setFontSize(20);
    doc.text('Relatório BPM', 14, 20);

    doc.setFontSize(12);
    doc.text(`Paciente: ${paciente}`, 14, 35);
    doc.text(`Cuidador: ${cuidador}`, 14, 45);

    const inicioTabelaDados = this.adicionarTabelaTestesBasais(
      doc,
      testesBasais,
      55
    );

    // TABELA DOS DADOS
    autoTable(doc, {

      startY: inicioTabelaDados,

      styles: {
        fontSize: 11,
        cellPadding: 4
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
      ]),

      headStyles: {
        fillColor: [255, 77, 77],
        textColor: [255, 255, 255],
        fontSize: 12
      }

    });
    let y =
      (doc as any)
      .lastAutoTable
      .finalY + 20;

    const imagemGraficoDia = this.criarImagemGraficoPDF(this.graficoDia);
    const imagemGraficoSemana = this.criarImagemGraficoPDF(this.graficoSemana);

    setTimeout(async () => {

      doc.setFontSize(14);
      doc.text('Gráfico Diário', 14, y);
      doc.addImage(imagemGraficoDia, 'PNG', 15, y + 5, 180, 80);
      y += 100;

      if (y > 220) {

        doc.addPage();

        y = 20;
      }

      doc.setFontSize(14);
      doc.text('Gráfico Semanal', 14, y);
      doc.addImage(imagemGraficoSemana, 'PNG', 15, y + 5, 180, 80);

      try {

        const pdfBase64 =
          doc.output('datauristring')
          .split(',')[1];

        await Filesystem.writeFile({

          path:
            `relatorio-bpm-${Date.now()}.pdf`,

          data:
            pdfBase64,

          directory:
            Directory.Documents

        });

        alert(
          'PDF salvo com sucesso!'
        );

      } catch (err: any) {

        console.error(
          'ERRO PDF:',
          err
        );

        alert(
          'Erro ao salvar PDF: ' +
          JSON.stringify(err)
        );

      }

    }, 500);

  });

}

// =========================
// ENVIAR EMAIL MÉDICOS
// =========================
enviarMedicos() {

  if (!this.cdPaciente || this.enviandoEmail) return;

  this.enviandoEmail = true;

  this.http.get<any>(
    `https://geriatric-care.onrender.com/resumo-pdf/${this.cdPaciente}`
  ).subscribe({
    next: (res) => {

    if (!this.graficoDia || !this.graficoSemana) {
      this.enviandoEmail = false;
      alert('Os gráficos ainda estão carregando. Tente novamente em alguns segundos.');
      return;
    }

    const dados = res?.dados ?? [];

    const paciente =
      res?.paciente ?? '-';

    const cuidador =
      res?.cuidador ?? '-';

    const testesBasais: TesteBasalRelatorio[] = res?.testes_basais ?? [];
    

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




    const inicioTabelaDados = this.adicionarTabelaTestesBasais(
      doc,
      testesBasais,
      55
    );

    // -------------------------
    // TABELA
    // -------------------------
    autoTable(doc, {

      startY: inicioTabelaDados,

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

    const imagemGraficoDia = this.criarImagemGraficoPDF(this.graficoDia);
    const imagemGraficoSemana = this.criarImagemGraficoPDF(this.graficoSemana);

    setTimeout(() => {

      doc.setFontSize(14);
      doc.text('Gráfico Diário', 14, y);
      doc.addImage(imagemGraficoDia, 'PNG', 15, y + 5, 180, 80);
      y += 100;

      // -------------------------
      // NOVA PÁGINA
      // -------------------------
      if (y > 220) {

        doc.addPage();

        y = 20;
      }

      doc.setFontSize(14);
      doc.text('Gráfico Semanal', 14, y);
      doc.addImage(imagemGraficoSemana, 'PNG', 15, y + 5, 180, 80);

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

        next: () => {

          this.enviandoEmail = false;
          alert('E-mail enviado com sucesso');
        },

        error: (err) => {

          this.enviandoEmail = false;
          const falhas = err.error?.falhas ?? [];
          const detalheFalhas = falhas.length
            ? ` ${falhas.map((falha: any) => `${falha.email ?? falha.medico}: ${falha.erro}`).join('; ')}`
            : '';

          alert(
            `${err.error?.erro ?? err.error?.mensagem ?? 'Falha ao enviar o e-mail.'}${detalheFalhas}`
          );
        }
      });

    }, 500);
    },
    error: (err) => {
      this.enviandoEmail = false;
      alert(
        `Não foi possível gerar o relatório para envio: ${err.error?.erro ?? err.message}`
      );
    }
  });
}
}