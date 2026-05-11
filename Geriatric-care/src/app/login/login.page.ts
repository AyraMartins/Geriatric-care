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
  IonModal
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

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // -------------------------
  // ALERT SIMPLES (faltava isso)
  // -------------------------
  showAlert(titulo: string, msg: string) {
    alert(`${titulo}\n\n${msg}`);
  }

  // -------------------------
  // ABRIR MODAL LOGIN
  // -------------------------
  abrirLogin(ev?: Event) {
    ev?.preventDefault?.();
    (document.activeElement as HTMLElement)?.blur();
    this.mostrarModalLogin = true;
  }

  // -------------------------
  // FECHAR MODAL LOGIN
  // -------------------------
  async fecharLogin() {
    this.mostrarModalLogin = false;
    await new Promise(r => setTimeout(r, 50));
    (document.activeElement as HTMLElement)?.blur();
    this.emailLogin = '';
    this.senhaLogin = '';
  }

  // -------------------------
  // VALIDA CADASTRO
  // -------------------------
  formValido() {
    return this.nome && this.email && this.telefone && this.senha;
  }

  // -------------------------
  // SALVAR CUIDADOR
  // -------------------------
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

  // -------------------------
  // LOGIN
  // -------------------------
  handleLogin() {

    const data = {
      email: this.emailLogin,
      senha: this.senhaLogin
    };

    if (!data.email) {
      this.showAlert('Campo obrigatório', 'Digite o email.');
      return;
    }

    if (!data.senha) {
      this.showAlert('Campo obrigatório', 'Digite a senha.');
      return;
    }

    this.http.post<any>(
      'http://localhost:5000/validar-login',
      data
    )
    .subscribe({

      next: (res) => {

        if (res.valido) {

          localStorage.setItem('cuidadorLogado', 'true');
          localStorage.setItem('email', data.email);
          localStorage.setItem('cd_cuidador', String(res.cd_cuidador));

          // -------------------------
          // BUSCA PACIENTE
          // -------------------------
          this.http.get<any>(
            `http://localhost:5000/paciente-cuidador/${res.cd_cuidador}`
          )
          .subscribe({

            next: (paciente) => {

              if (!paciente?.cd_paciente) {
                this.showAlert('Erro', 'Paciente não encontrado.');
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
              this.showAlert('Erro', 'Paciente não encontrado.');
            }
          });

        } else {
          this.showAlert('Erro', 'Email ou senha inválidos.');
        }
      },

      error: () => {
        this.showAlert('Erro', 'Erro ao conectar com servidor.');
      }
    });
  }
}