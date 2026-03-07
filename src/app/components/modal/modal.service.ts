import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ModalInput {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'email' | 'password' | 'date';
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  value?: any;
  visibleWhen?: { key: string; values: string[] };
}

export interface ModalConfig {
  type: 'confirm' | 'prompt' | 'alert';
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'danger' | 'warning';
  inputs?: ModalInput[];
  resolve?: (value: any) => void;
}

@Injectable({ providedIn: 'root' })
export class ModalService {
  private modalSubject = new BehaviorSubject<ModalConfig | null>(null);
  modal$ = this.modalSubject.asObservable();

  confirm(options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'primary' | 'danger' | 'warning';
  }): Promise<boolean> {
    return new Promise(resolve => {
      this.modalSubject.next({
        type: 'confirm',
        ...options,
        resolve,
      });
    });
  }

  prompt(options: {
    title: string;
    message?: string;
    inputs: ModalInput[];
    confirmText?: string;
    cancelText?: string;
  }): Promise<Record<string, any> | null> {
    return new Promise(resolve => {
      this.modalSubject.next({
        type: 'prompt',
        ...options,
        resolve,
      });
    });
  }

  alert(options: { title: string; message: string }): Promise<void> {
    return new Promise(resolve => {
      this.modalSubject.next({
        type: 'alert',
        ...options,
        resolve,
      });
    });
  }

  close() {
    this.modalSubject.next(null);
  }
}
