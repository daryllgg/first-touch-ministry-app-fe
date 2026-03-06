import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToastController } from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

const ionicColorMap: Record<Toast['type'], string> = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'primary',
};

@Injectable({ providedIn: 'root' })
export class ToastService {
  private isWeb = environment.platform === 'web';
  private toasts: Toast[] = [];
  private nextId = 0;
  toasts$ = new BehaviorSubject<Toast[]>([]);

  constructor(private toastCtrl: ToastController) {}

  success(message: string, duration = 3000) {
    this.show('success', message, duration);
  }

  error(message: string, duration = 4000) {
    this.show('error', message, duration);
  }

  warning(message: string, duration = 3000) {
    this.show('warning', message, duration);
  }

  info(message: string, duration = 3000) {
    this.show('info', message, duration);
  }

  private show(type: Toast['type'], message: string, duration: number) {
    if (this.isWeb) {
      const toast: Toast = { id: ++this.nextId, type, message };
      this.toasts = [...this.toasts, toast];
      this.toasts$.next(this.toasts);
      setTimeout(() => this.dismiss(toast.id), duration);
    } else {
      this.showIonicToast(type, message, duration);
    }
  }

  private async showIonicToast(type: Toast['type'], message: string, duration: number) {
    const toast = await this.toastCtrl.create({
      message,
      duration,
      color: ionicColorMap[type],
      position: 'top',
    });
    await toast.present();
  }

  dismiss(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toasts$.next(this.toasts);
  }
}
