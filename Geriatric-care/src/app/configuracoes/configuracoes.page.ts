import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  IonToggle
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
    IonIcon,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonToggle,
    CommonModule,
    FormsModule
  ]
})
export class ConfiguracoesPage implements OnInit {

  modoEscuro: boolean = false;

  configuracoes = [
    {
      nome: 'Conta',
      descricao: 'Gerenciar conta',
      icone: 'person-outline'
    },
     {
      nome: 'Cuidadores',
      descricao: 'Gerenciar Cuidadores',
      icone: 'person-add-outline'
    },
    {
      nome: 'Ajuda',
      descricao: 'Central de ajuda',
      icone: 'help-circle-outline'
    }
  ];

  constructor() { }

  ngOnInit() {

    const tema = localStorage.getItem('modoEscuro');

    if (tema === 'true') {

      this.modoEscuro = true;
      document.body.classList.add('dark');

    }

  }

  trocarTema() {

    this.modoEscuro = !this.modoEscuro;

    if (this.modoEscuro) {

      document.body.classList.add('dark');
      localStorage.setItem('modoEscuro', 'true');

    } else {

      document.body.classList.remove('dark');
      localStorage.setItem('modoEscuro', 'false');

    }

  }

  excluir(item: any) {

    this.configuracoes =
      this.configuracoes.filter(c => c !== item);

  }

}