import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonInput,
  IonItem,
  IonList,
  IonButton,
  IonText,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonLabel
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-cadastro-paciente',
  templateUrl: './cadastro-paciente.page.html',
  styleUrls: ['./cadastro-paciente.page.scss'],
  standalone: true,

  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonInput,
    IonItem,
    IonList,
    IonButton,
    IonText,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonLabel,
    CommonModule,
    FormsModule
  ]
})

export class CadastroPacientePage implements OnInit {

  // NOME
  nome: string = '';

  // DATA NASCIMENTO
  dataNascimento: string = '';

  // VALIDAÇÃO
  nomeTouched: boolean = false;

  // ID DO CUIDADOR
  cdCuidador: number = 0;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.aplicarTemaSalvo();

    // PEGA ID DO CUIDADOR SALVO NO LOGIN
    const id = localStorage.getItem('cd_cuidador');

    if (id) {
      this.cdCuidador = Number(id);
    }

    console.log('ID cuidador:', this.cdCuidador);
  }
  private aplicarTemaSalvo() {

  const tema = localStorage.getItem('modoEscuro');

  if (tema === 'true') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

  // PEGA DATA DO DATETIME
  pegarData(event: any) {

    this.dataNascimento = event.detail.value;

    console.log(this.dataNascimento);
  }

  // VALIDA FORMULÁRIO
  formValido(): boolean {

    return !!(
      this.nome &&
      this.dataNascimento
    );
  }

  // SALVAR PACIENTE
  salvarPaciente() {

    const dados = {

      nome: this.nome,

      data_nascimento: this.dataNascimento,

      cd_cuidador: this.cdCuidador
    };

    console.log(dados);

    this.http.post(
      'https://geriatric-care.onrender.com/paciente',
      dados
    ).subscribe({

      next: (res: any) => {

        console.log('Paciente salvo com sucesso', res);

        if (res.cd_paciente) {
          localStorage.setItem('cd_paciente', res.cd_paciente.toString());
        }

        // REDIRECIONA PARA HOME
        this.router.navigate(['/home']);
      },

      error: (err) => {

        console.log('Erro ao salvar:', err);

      }
    });
  }

}