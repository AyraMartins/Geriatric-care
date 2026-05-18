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
    private http: HttpClient
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

      `http://192.168.0.132:5000/cuidadores-extra/${cd_paciente}`

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

  excluirCuidador(id: number) {

    this.http.delete(

      `http://192.168.0.132:5000/cuidadores-extra/${id}`

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

    // EDITAR

    if (this.editarId) {

      this.http.put(

        `http://192.168.0.132:5000/cuidadores-extra/${this.editarId}`,

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

    // NOVO

    else {

      this.http.post(

        'http://192.168.0.132:5000/cuidadores-extra',

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

}