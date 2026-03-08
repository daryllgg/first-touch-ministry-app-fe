import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonDatetime, IonModal, IonButton, IonContent } from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [CommonModule, IonDatetime, IonModal, IonButton, IonContent],
  template: `
    @if (isWeb) {
      <div class="time-picker-wrapper" (click)="$event.stopPropagation()">
        <button type="button" class="time-picker-trigger" (click)="toggle()">
          <span [class.placeholder]="!value">{{ displayValue }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </button>
        @if (isOpen) {
          <div class="time-picker-dropdown">
            <ion-datetime
              presentation="time"
              [value]="ionValue"
              (ionChange)="onTimeSelect($event)"
            ></ion-datetime>
          </div>
        }
      </div>
    } @else {
      <button type="button" class="time-picker-trigger" (click)="openMobile($event)">
        <span [class.placeholder]="!value">{{ displayValue }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </button>
      <ion-modal [isOpen]="isOpen" (didDismiss)="isOpen = false" [breakpoints]="[0, 0.4]" [initialBreakpoint]="0.4">
        <ng-template>
          <ion-content>
            <div class="mobile-time-container">
              <div class="mobile-time-header">
                <span class="mobile-time-title">{{ placeholder }}</span>
                <ion-button fill="clear" (click)="isOpen = false">Done</ion-button>
              </div>
              <ion-datetime
                presentation="time"
                [value]="ionValue"
                (ionChange)="onTimeSelect($event)"
              ></ion-datetime>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>
    }
  `,
  styles: [`
    .time-picker-wrapper {
      position: relative;
    }

    .time-picker-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      background: white;
      color: #1e293b;
      font-size: 0.95rem;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .time-picker-trigger:hover {
      border-color: #94a3b8;
    }

    .time-picker-trigger svg {
      flex-shrink: 0;
      color: #94a3b8;
    }

    .placeholder {
      color: #94a3b8;
    }

    .time-picker-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 100;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      padding: 8px;
      width: fit-content;
      min-width: 300px;
    }

    .time-picker-dropdown ion-datetime {
      --background: white;
    }

    .mobile-time-container {
      padding: 16px;
    }

    .mobile-time-container ion-datetime {
      margin: 0 auto;
    }

    .mobile-time-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .mobile-time-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }
  `],
})
export class TimePickerComponent {
  @Input() value: string = '';
  @Input() placeholder: string = 'Select time';
  @Output() valueChange = new EventEmitter<string>();

  isWeb = environment.platform === 'web';
  isOpen = false;

  get displayValue(): string {
    if (!this.value) return this.placeholder;
    return this.formatTime(this.value);
  }

  get ionValue(): string {
    if (!this.value) return '1900-01-01T10:00:00';
    return `1900-01-01T${this.value}:00`;
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.isWeb) {
      this.isOpen = false;
    }
  }

  openMobile(event: Event) {
    event.stopPropagation();
    this.isOpen = true;
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  onTimeSelect(event: any) {
    const val = event.detail.value;
    if (val) {
      const match = val.match(/T(\d{2}:\d{2})/);
      if (match) {
        this.value = match[1];
        this.valueChange.emit(match[1]);
      }
    }
  }

  private formatTime(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

}
