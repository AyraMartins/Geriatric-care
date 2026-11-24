import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  grafico_horario?: Array<{
    hora: number;
    media: number | null;
  }>;
}

type AcaoRelatorio = 'download' | 'email';

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
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RelatorioPage implements OnInit {

  resumoDiario: any[] = [];

  graficoDia: any;
  graficoSemana: any;

  cdPaciente: number | null = null;
  enviandoEmail = false;
  modalPeriodoAberto = false;
  dataInicial = '';
  dataFinal = '';
  erroDatas = '';
  acaoRelatorio: AcaoRelatorio = 'download';
  dataHoje = this.obterHojeISO();

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

private criarImagemGraficoPDF(
  labels: string[],
  medias: Array<number | null>,
  tituloEixoX: string
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 400;

  const graficoPDF = new Chart(canvas, {
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
      responsive: false,
      animation: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: tituloEixoX,
            color: '#000000'
          },
          ticks: { color: '#000000' },
          grid: { color: 'rgba(0, 0, 0, 0.12)' }
        },
        y: {
          title: {
            display: true,
            text: 'BPM (Média)',
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

private criarDocumentoRelatorio(
  res: ResumoPdfResponse,
  dataInicial: string,
  dataFinal: string
): jsPDF {
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
  doc.text(
    `Período: ${this.formatarData(dataInicial)} a ${this.formatarData(dataFinal)}`,
    14,
    55
  );

  let y = this.adicionarTabelaTestesBasais(doc, testesBasais, 65);

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

  const imagemGraficoDia = this.criarImagemGraficoPDF(
    (res.grafico_horario ?? []).map(item => `${String(item.hora).padStart(2, '0')}h`),
    (res.grafico_horario ?? []).map(item => item.media),
    'Hora'
  );
  const imagemGraficoSemana = this.criarImagemGraficoPDF(
    dados.map(item => item.data),
    dados.map(item => item.media),
    'Data'
  );
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
private criarPdfBase64(
  res: ResumoPdfResponse,
  dataInicial: string,
  dataFinal: string
): string {
  const dataUri = this.criarDocumentoRelatorio(
    res,
    dataInicial,
    dataFinal
  ).output('datauristring');
  const separator = dataUri.indexOf(',');
  if (separator < 0) {
    throw new Error('O documento gerado não possui um formato PDF válido.');
  }
  return dataUri.slice(separator + 1);
}

baixarPDF() {
  this.abrirModalPeriodo('download');
}

enviarMedicos() {
  if (!this.enviandoEmail) {
    this.abrirModalPeriodo('email');
  }
}

abrirModalPeriodo(acao: AcaoRelatorio) {
  if (!this.cdPaciente || this.enviandoEmail) return;

  this.acaoRelatorio = acao;
  this.dataInicial = '';
  this.dataFinal = '';
  this.erroDatas = '';
  this.dataHoje = this.obterHojeISO();
  this.modalPeriodoAberto = true;
}

fecharModalPeriodo() {
  this.modalPeriodoAberto = false;
  this.erroDatas = '';
}

confirmarPeriodo() {
  if (!this.dataInicial || !this.dataFinal) {
    this.erroDatas = 'Informe a data inicial e a data final.';
    return;
  }

  if (!this.dataISOValida(this.dataInicial) || !this.dataISOValida(this.dataFinal)) {
    this.erroDatas = 'Informe datas válidas.';
    return;
  }
  if (this.dataInicial > this.dataFinal) {
    this.erroDatas = 'A data inicial não pode ser posterior à data final.';
    return;
  }
  if (this.dataInicial > this.dataHoje || this.dataFinal > this.dataHoje) {
    this.erroDatas = 'Não é permitido selecionar datas futuras.';
    return;
  }

  const { dataInicial, dataFinal, acaoRelatorio } = this;
  this.fecharModalPeriodo();
  this.processarRelatorio(acaoRelatorio, dataInicial, dataFinal);
}

private processarRelatorio(
  acao: AcaoRelatorio,
  dataInicial: string,
  dataFinal: string
) {
  const cdPaciente = this.cdPaciente;
  if (!cdPaciente) return;

  if (acao === 'email') {
    this.enviandoEmail = true;
  }

  this.http.get<ResumoPdfResponse>(
    `https://geriatric-care.onrender.com/resumo-pdf/${cdPaciente}` +
    `?data_inicial=${encodeURIComponent(dataInicial)}` +
    `&data_final=${encodeURIComponent(dataFinal)}`
  ).subscribe({
    next: async res => {
      let pdfBase64: string;
      try {
        pdfBase64 = this.criarPdfBase64(res, dataInicial, dataFinal);
      } catch (err: unknown) {
        this.enviandoEmail = false;
        console.error('ERRO PDF:', err);
        alert(`Não foi possível gerar o PDF: ${String(err)}`);
        return;
      }

      if (acao === 'download') {
        try {
          await Filesystem.writeFile({
            path: `relatorio-bpm-${Date.now()}.pdf`,
            data: pdfBase64,
            directory: Directory.Documents
          });
          alert('PDF salvo com sucesso!');
        } catch (err: unknown) {
          console.error('ERRO PDF:', err);
          alert(`Erro ao salvar PDF: ${String(err)}`);
        }
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
      const mensagem = err.error?.erro ?? err.message;
      alert(
        acao === 'download'
          ? `Não foi possível gerar o relatório: ${mensagem}`
          : `Não foi possível gerar o relatório para envio: ${mensagem}`
      );
    }
  });
}

private obterHojeISO(): string {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${hoje.getFullYear()}-${mes}-${dia}`;
}

private formatarData(data: string): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

private dataISOValida(data: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;

  const [ano, mes, dia] = data.split('-').map(Number);
  const valor = new Date(ano, mes - 1, dia);
  return valor.getFullYear() === ano &&
    valor.getMonth() === mes - 1 &&
    valor.getDate() === dia;
}
}