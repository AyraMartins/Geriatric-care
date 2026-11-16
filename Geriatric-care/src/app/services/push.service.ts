
import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

@Injectable({
  providedIn: 'root'
})
export class PushService {

  constructor() {}

  async iniciarNotificacoes() {

    if (!Capacitor.isNativePlatform()) {
      console.log('Push disponível somente no aplicativo nativo.');
      return;
    }

    try {

      // Solicitar permissão
      let permissao = await PushNotifications.checkPermissions();

      if (permissao.receive === 'prompt') {
        permissao = await PushNotifications.requestPermissions();
      }

      if (permissao.receive !== 'granted') {
        console.log('Permissão de notificações não concedida.');
        return;
      }

      // Receber o token do Firebase
      await PushNotifications.addListener('registration', token => {

        console.log('TOKEN FCM:', token.value);

      });

      // Erro no registro
      await PushNotifications.addListener('registrationError', error => {

        console.error('ERRO NO REGISTRO PUSH:', error);

      });

      // Notificação recebida com o aplicativo aberto
      await PushNotifications.addListener('pushNotificationReceived', notification => {

        console.log('NOTIFICAÇÃO RECEBIDA:', notification);

      });

      // Usuário clicou na notificação
      await PushNotifications.addListener('pushNotificationActionPerformed', action => {

        console.log('NOTIFICAÇÃO CLICADA:', action);

      });

      // Registrar no Firebase
      await PushNotifications.register();

      console.log('Registro de notificações iniciado.');

    } catch (error) {

      console.error('ERRO AO INICIAR PUSH:', error);

    }

  }
}
