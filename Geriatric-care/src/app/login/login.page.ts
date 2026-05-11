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
  IonAlert
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';

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
    IonAlert,
    CommonModule,
    FormsModule
  ]
})
export class LoginPage implements OnInit {

  nome = '';
  email = '';
  telefone = '';
  senha = '';
  
  // Campos de validação do alert login
  emailLogin = '';
  senhaLogin = '';
  emailLoginTouched = false;
  senhaLoginTouched = false;
  
  alertInputsLogin = [
    {
      name: 'email',
      type: 'email',
      placeholder: 'Email',
      attributes: {
        inputmode: 'email'
      }
    },
    {
      name: 'senha',
      type: 'password',
      placeholder: 'Senha'
    }
  ];

  alertButtonsLogin = [
    {
      text: 'Cancelar',
      role: 'cancel'
    },
    {
      text: 'Ir',
      handler: (data: any) => this.handleLogin(data)
    }
  ];

  nomeTouched = false;
  emailTouched = false;
  telefoneTouched = false;
  senhaTouched = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private alertController: AlertController
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
      senha: this.senha,
      cd_senha: this.senha
    };

    this.http.post<any>('http://localhost:5000/cuidador', dados)
      .subscribe({
        next: (res) => {

          console.log('Salvo com sucesso', res);

          // salva login
          localStorage.setItem('cuidadorLogado', 'true');
          localStorage.setItem('email', this.email);
          localStorage.setItem('senha', this.senha);

          // salva ID do cuidador
          localStorage.setItem(
            'cd_cuidador',
            res.cd_cuidador.toString()
          );

          // vai para cadastro paciente
          this.router.navigate(['/cadastro-paciente']);
        },

        error: (err) => {
          console.log('Erro ao salvar:', err);
        }
      });
  }

  handleLogin(data: any) {
    if (!data.email || !data.senha) {
      this.showAlert('Erro', 'Email e senha são obrigatórios.');
      return false;
    }

    // Valida no backend
    this.http.post<any>('http://localhost:5000/validar-login', {
      email: data.email,
      senha: data.senha
    }).subscribe({
      next: (res) => {
        if (res.valido) {
          localStorage.setItem('cuidadorLogado', 'true');
          localStorage.setItem('email', data.email);
          localStorage.setItem('cd_cuidador', res.cd_cuidador.toString());
          this.router.navigate(['/home']);
        } else {
          this.showAlert('Erro', res.erro || 'Email ou senha inválidos.');
        }
      },
      error: (err) => {
        console.log('Erro ao validar login:', err);
        this.showAlert('Erro', 'Erro ao conectar com o servidor.');
      }
    });

    return false;
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });

    await alert.present();
  }
}
