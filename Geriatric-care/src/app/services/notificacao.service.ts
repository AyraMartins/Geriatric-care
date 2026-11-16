
import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Injectable({
  providedIn: 'root'
})
export class NotificacaoService {

  async solicitarPermissao() {
    const permissao = await LocalNotifications.requestPermissions();

    return permissao.display === 'granted';
  }

  async enviarAlerta(bpm: number) {

    const permissao = await LocalNotifications.checkPermissions();

    if (permissao.display !== 'granted') {
      return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1001,
          title: 'Alerta de batimentos cardíacos!',
          body: `O paciente atingiu ${bpm} BPM. Verifique o paciente.`,
          schedule: {
            at: new Date(Date.now() + 1000)
          }
        }
      ]
    });

    await Haptics.vibrate();
  }
}
