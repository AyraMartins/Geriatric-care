import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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
  IonInput,
  AlertController

} from '@ionic/angular/standalone';

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
    FormsModule
  ]
})
export class ConfiguracoesPage implements OnInit {

  modoEscuro = false;

  modalConta = false;
  modalCuidadores = false;
  modalAjuda = false;
  modalNovoCuidador = false;

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
      nome: 'Ajuda',
      descricao: 'Central de ajuda',
      icone: 'help-circle-outline'
    }

  ];

  constructor(
  private http: HttpClient,
  private alertController: AlertController
) { }

  ngOnInit() {

    const tema =
      localStorage.getItem('modoEscuro');

    if (tema === 'true') {

      this.modoEscuro = true;

      document.body.classList.add('dark');

    }

    this.carregarCuidadores();

  }

  trocarTema() {

    this.modoEscuro = !this.modoEscuro;

    if (this.modoEscuro) {

      document.body.classList.add('dark');

      localStorage.setItem(
        'modoEscuro',
        'true'
      );

    } else {

      document.body.classList.remove('dark');

      localStorage.setItem(
        'modoEscuro',
        'false'
      );

    }

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

    if (item.nome === 'Ajuda') {

      this.modalAjuda = true;

    }

  }

  fecharModais() {

    this.modalConta = false;
    this.modalCuidadores = false;
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

}