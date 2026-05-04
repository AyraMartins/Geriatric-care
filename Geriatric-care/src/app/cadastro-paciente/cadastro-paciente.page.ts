import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonList, // ✅ FALTAVA ISSO
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-cadastro-paciente',
  templateUrl: './cadastro-paciente.page.html',
  styleUrls: ['./cadastro-paciente.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    IonDatetime,
    IonDatetimeButton,
    IonModal,
    IonList, // ✅ FALTAVA ISSO
  ],
})
export class CadastroPacientePage {

  nome = '';
  nomeTouched = false; // ✅ FALTAVA ISSO

  formValido() {
    return this.nome.trim().length > 0;
  }
}