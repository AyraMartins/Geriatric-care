import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { BpmService } from '../services/bpm';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonModal,
  IonButton,
  IonToggle,
  IonCardHeader,
  IonCardTitle,
  IonCard,
  IonCardSubtitle,
  IonCardContent,
  IonSelect,
  IonSelectOption,
  IonAccordion,
  IonAccordionGroup,
  IonInput,
  AlertController

} from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-configuracoes',
  templateUrl: './configuracoes.page.html',
  styleUrls: ['./configuracoes.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonIcon,
    IonItemSliding,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonItemOptions,
    IonItemOption,
    IonToggle,
    CommonModule,
    IonButton,
    IonModal,
    IonAccordion,
    IonAccordionGroup,
    FormsModule
  ]
})
export class ConfiguracoesPage implements OnInit {

  modoEscuro = false;

  modalConta = false;
  modalCuidadores = false;
  modalAjuda = false;
  modalNovoCuidador = false;
  modalTesteBasal = false;
  modalEditarConta = false;

  tipoEdicao = '';

  ajuda = {

    assunto: '',
    descricao: ''

  };

  dadosConta = {

    nome_cuidador: '',
    email_cuidador: '',
    telefone_cuidador: '',

    nome_paciente: '',
    data_nascimento: ''

  };

  cuidadoresExtras: any[] = [];

  editarId: number | null = null;

  novoCuidador = {

    nome: '',
    email: '',
    telefone: '',
    cd_tipo: ''

  };

testeBasal = {
  cd_tipo: '',
  iniciando: false
};

mostrarInstrucoes = false;
instrucoesAbertas = false;

editandoTesteBasal = false;

instrucoesTeste = {
  titulo: '',
  texto: ''
};
bpmAtual = 0;

tempoRestante = 300;

bpmColetados: number[] = [];
testesBasais: any[] = [];

private intervaloTeste: any;


  configuracoes = [

    {
      nome: 'Conta',
      descricao: 'Gerenciar conta',
      icone: 'person-outline'
    },

    {
      nome: 'Cuidadores',
      descricao: 'Gerenciar cuidadores',
      icone: 'people-outline'
    },

     {
      nome: 'Teste Basal',
      descricao: 'Teste basal',
      icone: 'heart-outline'
    },

    {
      nome: 'Ajuda',
      descricao: 'Central de ajuda',
      icone: 'help-circle-outline'
    }

  ];

constructor(
  private http: HttpClient,
  private alertController: AlertController,
  private router: Router,
  private bpmService: BpmService
) { }

ngOnInit() {

  const tema = localStorage.getItem('modoEscuro');

  if (tema === 'true') {

    this.modoEscuro = true;

    document.body.classList.add('dark');

  } else {

    this.modoEscuro = false;

    document.body.classList.remove('dark');

  }

  this.carregarCuidadores();

  // -----------------------------------------
  // RECEBER BPM
  // -----------------------------------------

  this.bpmService.bpm$.subscribe(bpm => {

    console.log('CONFIG BPM RECEBIDO:', bpm);

    // Ignora valores nulos
    if (bpm === null) {
      return;
    }

    // Atualiza BPM atual na tela
    this.bpmAtual = bpm;

    // -----------------------------------------
    // COLETAR BPM DURANTE TESTE BASAL
    // -----------------------------------------

    if (this.testeBasal.iniciando && bpm > 0) {

      this.bpmColetados.push(bpm);

      console.log(
        'BPM COLETADO:',
        bpm
      );

      console.log(
        'TOTAL COLETADOS:',
        this.bpmColetados.length
      );

    }

  });

} 
selecionarTipoTeste() {

  this.mostrarInstrucoes = false;
  this.instrucoesAbertas = false;

  if (!this.testeBasal.cd_tipo) {
    return;
  }

  this.mostrarInstrucoes = true;

  switch (Number(this.testeBasal.cd_tipo)) {

    case 1:
      this.instrucoesTeste = {
        titulo: 'Como realizar o teste em repouso',
        texto: '...'
      };
      break;

    case 2:
      this.instrucoesTeste = {
        titulo: 'Como realizar o teste após caminhada',
        texto: '...'
      };
      break;

    case 3:
      this.instrucoesTeste = {
        titulo: 'Como realizar o teste após exercício intenso',
        texto: '...'
      };
      break;
  }

}

toggleInstrucoes() {

  this.instrucoesAbertas = !this.instrucoesAbertas;

}




  trocarTema() { this.modoEscuro = !this.modoEscuro; 
  
    if (this.modoEscuro) { document.body.classList.add('dark'); localStorage.setItem( 'modoEscuro', 'true' ); }
  
    else { document.body.classList.remove('dark'); localStorage.setItem( 'modoEscuro', 'false' ); } 
  
  }

  

  abrirModal(item: any) {

    this.fecharModais();

    if (item.nome === 'Conta') {

      this.modalConta = true;

      this.carregarConta();

    }

    if (item.nome === 'Cuidadores') {

      this.modalCuidadores = true;

      this.carregarCuidadores();

    }
    if (item.nome === 'Teste Basal') {

      this.modalTesteBasal = true;
      this.carregarTestesBasais();


    }

    if (item.nome === 'Ajuda') {

      this.modalAjuda = true;

    }

  }

  fecharModais() {

    this.modalConta = false;
    this.modalCuidadores = false;
    this.modalTesteBasal = false;
    this.modalAjuda = false;


  }

  abrirNovoCuidador() {

    this.editarId = null;

    this.novoCuidador = {

      nome: '',
      email: '',
      telefone: '',
      cd_tipo: ''

    };

    this.modalNovoCuidador = true;

  }

  fecharNovoCuidador() {

    this.modalNovoCuidador = false;

  }

  carregarCuidadores() {

    const cd_paciente =
      localStorage.getItem('cd_paciente');

    if (!cd_paciente) {

      return;

    }

    this.http.get<any[]>(

      `https://geriatric-care.onrender.com/cuidadores-extra/${cd_paciente}`

    ).subscribe({

      next: (res) => {

        this.cuidadoresExtras = res;

      },

      error: (erro) => {

        console.log(
          'ERRO:',
          erro
        );

      }

    });

  }

  editarCuidador(cuidador: any) {

    this.editarId =
      cuidador.cd_cuidador_extra;

    this.novoCuidador = {

      nome:
        cuidador.nm_cuidador,

      email:
        cuidador.email_cuidador,

      telefone:
        cuidador.tel_cuidador,

      cd_tipo:
        cuidador.cd_tipo

    };

    this.modalNovoCuidador = true;

  }
async excluirCuidador(id: number) {

  const alert = await this.alertController.create({

    header: 'Excluir cuidador',

    message: 'Tem certeza que deseja excluir este cuidador?',

    buttons: [

      {
        text: 'Cancelar',
        role: 'cancel'
      },

      {
        text: 'Sim',
        role: 'destructive',

        handler: () => {

          this.http.delete(

            `https://geriatric-care.onrender.com/cuidadores-extra/${id}`

          ).subscribe({

            next: () => {

              this.carregarCuidadores();

            },

            error: (erro) => {

              console.log(
                'ERRO EXCLUIR:',
                erro
              );

            }

          });

        }

      }

    ]

  });

  await alert.present();

}

  salvarNovoCuidador() {

    const cd_paciente =
      localStorage.getItem('cd_paciente');

    const body = {

      nome:
        this.novoCuidador.nome,

      email:
        this.novoCuidador.email,

      telefone:
        this.novoCuidador.telefone,

      cd_tipo:
        this.novoCuidador.cd_tipo,

      cd_paciente:
        cd_paciente

    };

    if (this.editarId) {

      this.http.put(

        `https://geriatric-care.onrender.com/cuidadores-extra/${this.editarId}`,

        body

      ).subscribe({

        next: () => {

          this.modalNovoCuidador = false;

          this.editarId = null;

          this.novoCuidador = {

            nome: '',
            email: '',
            telefone: '',
            cd_tipo: ''

          };

          this.carregarCuidadores();

        },

        error: (erro) => {

          console.log(
            'ERRO EDITAR:',
            erro
          );

        }

      });

    }

    else {

      this.http.post(

        'https://geriatric-care.onrender.com/cuidadores-extra',

        body

      ).subscribe({

        next: () => {

          this.modalNovoCuidador = false;

          this.novoCuidador = {

            nome: '',
            email: '',
            telefone: '',
            cd_tipo: ''

          };

          this.carregarCuidadores();

        },

        error: (erro) => {

          console.log(
            'ERRO SALVAR:',
            erro
          );

        }

      });

    }

  }

  enviarAjuda() {

    const body = {

      assunto: this.ajuda.assunto,
      descricao: this.ajuda.descricao,

      email:
        localStorage.getItem('email')

    };

    this.http.post(

      'https://geriatric-care.onrender.com/enviar-ajuda',

      body

    ).subscribe({

      next: () => {

        alert('Ajuda enviada com sucesso');

        this.ajuda = {

          assunto: '',
          descricao: ''

        };

        this.modalAjuda = false;

      },

      error: (erro) => {

        console.log(
          'ERRO AJUDA:',
          erro
        );

        alert('Erro ao enviar ajuda');

      }

    });

  }

  carregarConta() {

    const cd_cuidador =
      localStorage.getItem('cd_cuidador');

    if (!cd_cuidador) {

      return;

    }

    this.http.get<any>(

      `https://geriatric-care.onrender.com/conta/${cd_cuidador}`

    ).subscribe({

      next: (res) => {

        this.dadosConta = {

          nome_cuidador:
            res.nome_cuidador,

          email_cuidador:
            res.email_cuidador,

          telefone_cuidador:
            res.telefone_cuidador,

          nome_paciente:
            res.nome_paciente,

          data_nascimento:
            res.data_nascimento

        };

      },

      error: (erro) => {

        console.log(
          'ERRO CONTA:',
          erro
        );

      }

    });

  }

  abrirEditarConta(tipo: string) {

    this.tipoEdicao = tipo;

    this.modalEditarConta = true;

  }

  fecharEditarConta() {

    this.modalEditarConta = false;

    this.tipoEdicao = '';

  }

  editarConta() {

    const cd_cuidador =
      localStorage.getItem('cd_cuidador');

    if (!cd_cuidador) {

      return;

    }

    this.http.put(

      `https://geriatric-care.onrender.com/conta/${cd_cuidador}`,

      this.dadosConta

    ).subscribe({

      next: () => {

        alert(
          'Conta atualizada'
        );

        this.modalEditarConta = false;

        this.carregarConta();

      },

      error: (erro) => {

        console.log(
          'ERRO EDITAR CONTA:',
          erro
        );

        alert(
          'Erro ao atualizar'
        );

      }

    });

  }


  logout() {

    localStorage.clear(); // ou remova só o que usa

    document.body.classList.remove('dark');

    this.router.navigateByUrl('/primeirapg', {
      replaceUrl: true
    });

  }

  carregarTestesBasais() {

  const cd_paciente =
    localStorage.getItem('cd_paciente');

  if (!cd_paciente) {
    return;
  }

  this.http.get<any[]>(
    `https://geriatric-care.onrender.com/testes-basais/${cd_paciente}`
  )
  .subscribe({

    next: (res) => {

      this.testesBasais = res.map(teste => ({

        ...teste,

        nm_tipo:
          Number(teste.cd_tipo) === 1
            ? 'Repouso'
            : Number(teste.cd_tipo) === 2
              ? 'Caminhando'
              : Number(teste.cd_tipo) === 3
                ? 'Exercício intenso'
                : '-'

      }));

      console.log(
        'TESTES BASAIS:',
        this.testesBasais
      );

    },

    error: (erro) => {

      console.log(
        'ERRO AO CARREGAR TESTES BASAIS:',
        erro
      );

    }

  });

}

 iniciarTesteBasal() {

  if (!this.testeBasal.cd_tipo) {

    alert('Selecione o tipo do teste');

    return;

  }

  this.bpmColetados = [];
  this.bpmAtual = 0;
  this.tempoRestante = 300;

  this.testeBasal.iniciando = true;

  console.log('TESTE BASAL INICIADO');

  this.intervaloTeste = setInterval(() => {

    this.tempoRestante--;

    console.log(
      'Tempo restante:',
      this.tempoRestante
    );

    console.log(
      'BPM atual:',
      this.bpmAtual
    );

    console.log(
      'Valores coletados:',
      this.bpmColetados
    );

    if (this.tempoRestante <= 0) {

      clearInterval(this.intervaloTeste);

      this.finalizarTesteBasal();

    }

  }, 1000);

}


cancelarTesteBasal() {

  if (this.intervaloTeste) {

    clearInterval(this.intervaloTeste);

    this.intervaloTeste = null;

  }

  this.testeBasal.iniciando = false;

  this.tempoRestante = 300;

  this.bpmColetados = [];

  this.bpmAtual = 0;

  console.log('TESTE BASAL CANCELADO');

}

finalizarTesteBasal() {

  this.testeBasal.iniciando = false;

  if (this.intervaloTeste) {

    clearInterval(this.intervaloTeste);

    this.intervaloTeste = null;

  }

  if (this.bpmColetados.length === 0) {

    alert(
      'Nenhum BPM foi coletado durante o teste.'
    );

    this.tempoRestante = 300;

    return;

  }

  const soma = this.bpmColetados.reduce(
    (total, bpm) => total + bpm,
    0
  );

  const mediaBpm = Math.round(
    soma / this.bpmColetados.length
  );

  const cd_paciente =
    localStorage.getItem('cd_paciente');

  if (!cd_paciente) {

    alert('Paciente não encontrado');

    return;

  }

  const body = {

    cd_paciente: Number(cd_paciente),

    cd_tipo: Number(
      this.testeBasal.cd_tipo
    ),

    media_bpm: mediaBpm

  };

  console.log(
    'SALVANDO TESTE BASAL:',
    body
  );

  // =========================================
  // EDITANDO
  // =========================================

  if (this.editandoTesteBasal && this.editarId) {

    this.http.put(

      `https://geriatric-care.onrender.com/teste-basal/${this.editarId}`,

      body

    ).subscribe({

      next: () => {

        console.log(
          'TESTE BASAL ATUALIZADO'
        );

        alert(
          `Teste atualizado!\nMédia: ${mediaBpm} BPM`
        );

        this.resetarTesteBasal();

        this.carregarTestesBasais();

      },

      error: (erro) => {

        console.log(
          'ERRO AO EDITAR TESTE:',
          erro
        );

        console.log(
          'ERRO SERVIDOR:',
          erro.error
        );

        alert(
          'Erro ao atualizar teste basal.'
        );

      }

    });

    return;

  }

  // =========================================
  // NOVO TESTE
  // =========================================

  this.http.post(

    'https://geriatric-care.onrender.com/teste-basal',

    body

  ).subscribe({

    next: (res: any) => {

      console.log(
        'TESTE BASAL SALVO:',
        res
      );

      alert(
        `Teste finalizado!\nMédia: ${mediaBpm} BPM`
      );

      this.resetarTesteBasal();

      this.carregarTestesBasais();

    },

    error: (erro) => {

      console.log(
        'ERRO TESTE BASAL:',
        erro
      );

      console.log(
        'ERRO DO SERVIDOR:',
        erro.error
      );

      alert(
        'Erro ao salvar teste basal'
      );

    }

  });

}


private resetarTesteBasal() {

  this.editarId = null;

  this.editandoTesteBasal = false;

  this.testeBasal = {

    cd_tipo: '',

    iniciando: false

  };

  this.tempoRestante = 300;

  this.bpmColetados = [];

  this.bpmAtual = 0;

}
async excluirTesteBasal(id: number) {

  const alertConfirmacao =
    await this.alertController.create({

      header: 'Excluir teste basal',

      message:
        'Tem certeza que deseja excluir este teste?',

      buttons: [

        {
          text: 'Não',
          role: 'cancel'
        },

        {
          text: 'Sim',
          role: 'destructive',

          handler: () => {

            this.http.delete(

              `https://geriatric-care.onrender.com/teste-basal/${id}`

            ).subscribe({

              next: () => {

                this.carregarTestesBasais();

                console.log(
                  'TESTE BASAL EXCLUÍDO'
                );

              },

              error: async (erro) => {

                console.log(
                  'ERRO AO EXCLUIR TESTE:',
                  erro
                );

                const erroAlert =
                  await this.alertController.create({

                    header: 'Erro',

                    message:
                      'Erro ao excluir teste basal.',

                    buttons: ['OK']

                  });

                await erroAlert.present();

              }

            });

          }

        }

      ]

    });

  await alertConfirmacao.present();

}


async presentAlertTesteBasal() {

  const alert = await this.alertController.create({

    header: 'Teste Basal',

    subHeader: 'Teste de batimentos cardíacos',

    message:
      'O teste basal é realizado para registrar a frequência cardíaca do paciente em uma determinada condição. ' +
      'Primeiro, selecione o tipo de teste: repouso, caminhada ou exercício intenso. ' +
      'Durante o teste, os batimentos cardíacos serão acompanhados pelo sistema. ' +
      'Ao final, informe a média de BPM registrada para salvar o resultado.',

    buttons: [
      {
        text: 'Entendi',
        role: 'confirm'
      }
    ]

  });

  await alert.present();

}

async editarTesteBasal(teste: any) {

  const alert = await this.alertController.create({

    header: 'Editar teste basal',

    message:
      `Tem certeza que deseja refazer o teste de ${teste.tipo}?`,

    buttons: [

      {
        text: 'Não',
        role: 'cancel'
      },

      {
        text: 'Sim',

        handler: () => {

          this.editarId = teste.cd_teste_basal;

          this.testeBasal = {

            cd_tipo: String(teste.cd_tipo),

            iniciando: false

          };

          this.editandoTesteBasal = true;

          this.bpmColetados = [];

          this.bpmAtual = 0;

          this.tempoRestante = 300;

          this.selecionarTipoTeste();

          console.log(
            'EDITANDO TESTE:',
            teste
          );

          this.iniciarTesteBasal();

        }

      }

    ]

  });

  await alert.present();

}

}

