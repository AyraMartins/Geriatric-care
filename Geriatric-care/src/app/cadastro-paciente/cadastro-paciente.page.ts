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

    // PEGA ID DO CUIDADOR SALVO NO LOGIN
    const id = localStorage.getItem('cd_cuidador');

    if (id) {
      this.cdCuidador = Number(id);
    }

    console.log('ID cuidador:', this.cdCuidador);
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
      'http://localhost:5000/paciente',
      dados
    ).subscribe({

      next: (res) => {

        console.log('Paciente salvo com sucesso', res);

        // REDIRECIONA PARA HOME
        this.router.navigate(['/home']);
      },

      error: (err) => {

        console.log('Erro ao salvar:', err);

      }
    });
  }

}