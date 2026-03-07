import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonDatetime, IonModal, IonButton, IonContent } from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, IonDatetime, IonModal, IonButton, IonContent],
  template: `
    @if (isWeb && !useOverlay) {
      <div class="date-picker-wrapper" (click)="$event.stopPropagation()">
        <button type="button" class="date-picker-trigger" (click)="toggle()">
          <span [class.placeholder]="!value">{{ displayValue }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </button>
        @if (isOpen) {
          <div class="date-picker-dropdown">
            <ion-datetime
              presentation="date"
              [value]="value"
              [max]="max"
              [min]="min"
              (ionChange)="onDateSelect($event)"
            ></ion-datetime>
          </div>
        }
      </div>
    } @else {
      <button type="button" class="date-picker-trigger" (click)="openMobile($event)">
        <span [class.placeholder]="!value">{{ displayValue }}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </button>
      <ion-modal [isOpen]="isOpen" (didDismiss)="isOpen = false" [breakpoints]="[0, 0.55]" [initialBreakpoint]="0.55">
        <ng-template>
          <ion-content>
            <div class="mobile-datetime-container">
              <div class="mobile-datetime-header">
                <span class="mobile-datetime-title">{{ placeholder }}</span>
                <ion-button fill="clear" (click)="isOpen = false">Done</ion-button>
              </div>
              <ion-datetime
                presentation="date"
                [value]="value"
                [max]="max"
                [min]="min"
                (ionChange)="onDateSelect($event)"
              ></ion-datetime>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>
    }
  `,
  styles: [`
    .date-picker-wrapper {
      position: relative;
    }

    .date-picker-trigger {
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

    .date-picker-trigger:hover {
      border-color: #94a3b8;
    }

    .date-picker-trigger svg {
      flex-shrink: 0;
      color: #94a3b8;
    }

    .placeholder {
      color: #94a3b8;
    }

    .date-picker-dropdown {
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

    .date-picker-dropdown ion-datetime {
      --background: white;
    }

    .mobile-datetime-container {
      padding: 16px;
    }

    .mobile-datetime-container ion-datetime {
      margin: 0 auto;
    }

    .mobile-datetime-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .mobile-datetime-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }
  `],
})
export class DatePickerComponent {
  @Input() value: string = '';
  @Input() placeholder: string = 'Select date';
  @Input() max?: string;
  @Input() min?: string;
  @Input() useOverlay = false;
  @Output() valueChange = new EventEmitter<string>();

  isWeb = environment.platform === 'web';
  isOpen = false;

  get displayValue(): string {
    if (!this.value) return this.placeholder;
    const date = new Date(this.value + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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

  onDateSelect(event: any) {
    const value = event.detail.value;
    if (value) {
      const dateOnly = value.split('T')[0];
      this.value = dateOnly;
      this.valueChange.emit(dateOnly);
    }
    if (this.isWeb) {
      this.isOpen = false;
    }
  }
}
