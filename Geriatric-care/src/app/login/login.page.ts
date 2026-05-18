import { Component } from '@angular/core';
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
  IonModal,
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
    IonModal,
    IonText,
    CommonModule,
    FormsModule
  ]
})
export class LoginPage {

  // cadastro
  nome = '';
  email = '';
  telefone = '';
  senha = '';

  // login modal
  mostrarModalLogin = false;

  emailLogin = '';
  senhaLogin = '';

  // touched (validação visual)
  nomeTouched = false;
  emailTouched = false;
  telefoneTouched = false;
  senhaTouched = false;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // ALERT SIMPLES
  showAlert(titulo: string, msg: string) {
    alert(`${titulo}\n\n${msg}`);
  }

  // ABRIR LOGIN
  abrirLogin(ev?: Event) {
    ev?.preventDefault?.();
    this.mostrarModalLogin = true;
  }

  // FECHAR LOGIN
  async fecharLogin() {
    this.mostrarModalLogin = false;
    this.emailLogin = '';
    this.senhaLogin = '';
  }

  // VALIDA CADASTRO
  formValido() {
    return this.nome && this.email && this.telefone && this.senha;
  }

  // SALVAR
  salvarCuidador() {

    const dados = {
      nome: this.nome,
      email: this.email,
      telefone: this.telefone,
      senha: this.senha,
      cd_senha: this.senha
    };

    this.http.post<any>('http://localhost:5000/cuidador', dados)
      .subscribe(res => {

        localStorage.setItem('cd_cuidador', String(res.cd_cuidador));
        localStorage.setItem('email', this.email);

        this.router.navigate(['/cadastro-paciente']);
      });
  }

  // LOGIN
  handleLogin() {

    if (!this.emailLogin) {
      this.showAlert('Erro', 'Digite o email');
      return;
    }

    if (!this.senhaLogin) {
      this.showAlert('Erro', 'Digite a senha');
      return;
    }

    const data = {
      email: this.emailLogin,
      senha: this.senhaLogin
    };

    this.http.post<any>('http://localhost:5000/validar-login', data)
      .subscribe({

        next: (res) => {

          if (!res.valido) {
            this.showAlert('Erro', 'Email ou senha inválidos');
            return;
          }

          localStorage.setItem('cuidadorLogado', 'true');
          localStorage.setItem('email', data.email);
          localStorage.setItem('cd_cuidador', String(res.cd_cuidador));

          this.http.get<any>(
            `http://localhost:5000/paciente-cuidador/${res.cd_cuidador}`
          ).subscribe({

            next: (paciente) => {

              if (!paciente?.cd_paciente) {
                this.showAlert('Erro', 'Paciente não encontrado');
                return;
              }

              localStorage.setItem(
                'cd_paciente',
                String(paciente.cd_paciente)
              );

              this.fecharLogin();
              this.router.navigate(['/home']);
            },

            error: () => {
              this.showAlert('Erro', 'Paciente não encontrado');
            }
          });

        },

        error: () => {
          this.showAlert('Erro', 'Erro ao conectar com servidor');
        }
      });
  }
}