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
  IonText
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
    CommonModule,
    FormsModule
  ]
})
export class LoginPage implements OnInit {

  nome = '';
  email = '';
  telefone = '';
  senha = '';

  nomeTouched = false;
  emailTouched = false;
  telefoneTouched = false;
  senhaTouched = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {}

  formValido() {
    return this.nome && this.email && this.telefone && this.senha;
  }

  salvarCuidador() {

    const dados = {
      nome: this.nome,
      email: this.email,
      telefone: this.telefone,
      senha: this.senha
    };

    this.http.post('http://localhost:5000/cuidador', dados)
      .subscribe({
        next: (res: any) => {
          console.log('Salvo com sucesso', res);

          localStorage.setItem('cuidadorLogado', 'true');

          this.router.navigate(['/cadastro-paciente']);
        },
        error: (err) => {
          console.log('Erro ao salvar:', err);
        }
      });
  }
}