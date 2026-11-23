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

interface BatimentoElevadoRelatorio {
  data: string;
  horario: string;
  batimentos: number;
}

interface ResumoPdfResponse {
  paciente?: string | null;
  cuidador?: string | null;
  dados?: Array<{
    data: string;
    media: number | null;
    maximo: number | null;
    minimo: number | null;
  }>;
  testes_basais?: TesteBasalRelatorio[];
  batimentos_elevados?: BatimentoElevadoRelatorio[];
  total_batimentos_elevados?: number;
}

interface JsPdfComAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
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
    },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    showHead: 'everyPage'
  });

  return this.ultimaPosicaoTabela(doc) + 10;
}

private ultimaPosicaoTabela(doc: jsPDF): number {
  const ultimaTabela = (doc as JsPdfComAutoTable).lastAutoTable;
  if (!ultimaTabela) {
    throw new Error('Não foi possível determinar a posição final da tabela.');
  }
  return ultimaTabela.finalY;
}

private adicionarTabelaBatimentosElevados(
  doc: jsPDF,
  batimentosElevados: BatimentoElevadoRelatorio[],
  total: number,
  startY: number
): number {
  const alturaPagina = doc.internal.pageSize.getHeight();
  const margemInferior = 14;
  let y = startY;

  if (y + 30 > alturaPagina - margemInferior) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.text('Ocorrências acima de 100 BPM', 14, y);
  doc.setFontSize(11);
  doc.text(`Total de registros: ${total}`, 14, y + 7);

  autoTable(doc, {
    startY: y + 12,
    head: [['Data', 'Horário', 'Batimentos (BPM)']],
    body: batimentosElevados.map(registro => [
      registro.data,
      registro.horario,
      registro.batimentos
    ]),
    styles: {
      fontSize: 11,
      cellPadding: 4
    },
    headStyles: {
      fillColor: [255, 77, 77],
      textColor: [255, 255, 255],
      fontSize: 12
    },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    showHead: 'everyPage'
  });

  return this.ultimaPosicaoTabela(doc) + 10;
}

private criarDocumentoRelatorio(res: ResumoPdfResponse): jsPDF {
  const dados = res.dados ?? [];
  const paciente = res.paciente ?? '-';
  const cuidador = res.cuidador ?? '-';
  const testesBasais = res.testes_basais ?? [];
  const batimentosElevados = res.batimentos_elevados ?? [];
  const totalBatimentosElevados =
    res.total_batimentos_elevados ?? batimentosElevados.length;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('Relatório BPM', 14, 20);
  doc.setFontSize(12);
  doc.text(`Paciente: ${paciente}`, 14, 35);
  doc.text(`Cuidador: ${cuidador}`, 14, 45);

  let y = this.adicionarTabelaTestesBasais(doc, testesBasais, 55);

  autoTable(doc, {
    startY: y,
    head: [['Data', 'Média', 'Máximo', 'Mínimo']],
    body: dados.map(item => [
      item.data ?? '-',
      item.media ?? '-',
      item.maximo ?? '-',
      item.minimo ?? '-'
    ]),
    styles: {
      fontSize: 11,
      cellPadding: 4
    },
    headStyles: {
      fillColor: [255, 77, 77],
      textColor: [255, 255, 255],
      fontSize: 12
    },
    pageBreak: 'auto',
    rowPageBreak: 'avoid',
    showHead: 'everyPage'
  });
  y = this.ultimaPosicaoTabela(doc) + 10;

  y = this.adicionarTabelaBatimentosElevados(
    doc,
    batimentosElevados,
    totalBatimentosElevados,
    y
  );

  const imagemGraficoDia = this.criarImagemGraficoPDF(this.graficoDia);
  const imagemGraficoSemana = this.criarImagemGraficoPDF(this.graficoSemana);
  y = this.adicionarGraficoPDF(doc, 'Gráfico Diário', imagemGraficoDia, y);
  this.adicionarGraficoPDF(doc, 'Gráfico Semanal', imagemGraficoSemana, y);

  return doc;
}

private adicionarGraficoPDF(
  doc: jsPDF,
  titulo: string,
  imagem: string,
  startY: number
): number {
  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();
  const larguraImagem = larguraPagina - 30;
  const alturaImagem = larguraImagem * (400 / 900);
  const alturaBloco = alturaImagem + 5;
  const margemInferior = 14;
  let y = startY;

  if (y + alturaBloco > alturaPagina - margemInferior) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.text(titulo, 14, y);
  doc.addImage(imagem, 'PNG', 15, y + 5, larguraImagem, alturaImagem);
  return y + alturaBloco + 10;
}

private graficosProntos(): boolean {
  if (this.graficoDia && this.graficoSemana) {
    return true;
  }

  alert('Os gráficos ainda estão carregando. Tente novamente em alguns segundos.');
  return false;
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
private criarPdfBase64(res: ResumoPdfResponse): string {
  const dataUri = this.criarDocumentoRelatorio(res).output('datauristring');
  const separator = dataUri.indexOf(',');
  if (separator < 0) {
    throw new Error('O documento gerado não possui um formato PDF válido.');
  }
  return dataUri.slice(separator + 1);
}

async baixarPDF() {
  const cdPaciente = this.cdPaciente;
  if (!cdPaciente || !this.graficosProntos()) return;

  this.http.get<ResumoPdfResponse>(
    `https://geriatric-care.onrender.com/resumo-pdf/${cdPaciente}`
  ).subscribe({
    next: async res => {
      try {
        await Filesystem.writeFile({
          path: `relatorio-bpm-${Date.now()}.pdf`,
          data: this.criarPdfBase64(res),
          directory: Directory.Documents
        });
        alert('PDF salvo com sucesso!');
      } catch (err: unknown) {
        console.error('ERRO PDF:', err);
        alert(`Erro ao salvar PDF: ${String(err)}`);
      }
    },
    error: err => {
      alert(
        `Não foi possível gerar o relatório: ${err.error?.erro ?? err.message}`
      );
    }
  });
}

enviarMedicos() {
  const cdPaciente = this.cdPaciente;
  if (!cdPaciente || this.enviandoEmail || !this.graficosProntos()) return;

  this.enviandoEmail = true;

  this.http.get<ResumoPdfResponse>(
    `https://geriatric-care.onrender.com/resumo-pdf/${cdPaciente}`
  ).subscribe({
    next: res => {
      let pdfBase64: string;
      try {
        pdfBase64 = this.criarPdfBase64(res);
      } catch (err: unknown) {
        this.enviandoEmail = false;
        console.error('ERRO PDF:', err);
        alert(`Não foi possível gerar o PDF: ${String(err)}`);
        return;
      }

      this.http.post(
        `https://geriatric-care.onrender.com/enviar-medicos/${cdPaciente}`,
        { pdf_base64: pdfBase64 }
      ).subscribe({
        next: () => {
          this.enviandoEmail = false;
          alert('E-mail enviado com sucesso');
        },
        error: err => {
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
    },
    error: err => {
      this.enviandoEmail = false;
      alert(
        `Não foi possível gerar o relatório para envio: ${err.error?.erro ?? err.message}`
      );
    }
  });
}
}