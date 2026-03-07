import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ModalConfig, ModalInput, ModalService } from './modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (config) {
      <div class="modal-backdrop" (click)="onCancel()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h2 class="modal-title">{{ config.title }}</h2>
          @if (config.message) {
            <p class="modal-message">{{ config.message }}</p>
          }

          @if (config.type === 'prompt' && config.inputs) {
            <div class="modal-form">
              @for (input of config.inputs; track input.key) {
                @if (!isInputVisible(input)) {
                } @else if (input.type === 'checkbox') {
                  <label class="modal-checkbox-label">
                    <input
                      type="checkbox"
                      [checked]="formValues[input.key]"
                      (change)="formValues[input.key] = $any($event.target).checked"
                    />
                    <span>{{ input.label }}</span>
                  </label>
                } @else if (input.type === 'select') {
                  <div class="modal-form-group">
                    <label class="modal-form-label">{{ input.label }}</label>
                    <select
                      class="modal-form-input"
                      [ngModel]="formValues[input.key]"
                      (ngModelChange)="formValues[input.key] = $event"
                    >
                      <option value="" disabled>{{ input.placeholder || 'Select...' }}</option>
                      @for (opt of input.options; track opt.value) {
                        <option [value]="opt.value">{{ opt.label }}</option>
                      }
                    </select>
                  </div>
                } @else if (input.type === 'textarea') {
                  <div class="modal-form-group">
                    <label class="modal-form-label">{{ input.label }}</label>
                    <textarea
                      class="modal-form-input modal-textarea"
                      [placeholder]="input.placeholder || ''"
                      [ngModel]="formValues[input.key]"
                      (ngModelChange)="formValues[input.key] = $event"
                      rows="3"
                    ></textarea>
                  </div>
                } @else {
                  <div class="modal-form-group">
                    <label class="modal-form-label">{{ input.label }}</label>
                    <input
                      class="modal-form-input"
                      [type]="input.type"
                      [placeholder]="input.placeholder || ''"
                      [ngModel]="formValues[input.key]"
                      (ngModelChange)="formValues[input.key] = $event"
                    />
                  </div>
                }
              }
            </div>
          }

          <div class="modal-actions">
            @if (config.type !== 'alert') {
              <button class="modal-btn modal-btn-cancel" (click)="onCancel()">
                {{ config.cancelText || 'Cancel' }}
              </button>
            }
            <button
              class="modal-btn"
              [class.modal-btn-primary]="!config.confirmColor || config.confirmColor === 'primary'"
              [class.modal-btn-danger]="config.confirmColor === 'danger'"
              [class.modal-btn-warning]="config.confirmColor === 'warning'"
              [disabled]="config.type === 'prompt' && !isFormValid"
              (click)="onConfirm()"
            >
              {{ config.confirmText || (config.type === 'alert' ? 'OK' : 'Confirm') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      animation: fadeIn 0.2s ease-out;
    }

    .modal-card {
      background: white;
      border-radius: 16px;
      padding: 28px;
      width: 90%;
      max-width: 460px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
      animation: scaleIn 0.2s ease-out;
    }

    .modal-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 8px;
      font-family: 'Inter', sans-serif;
    }

    .modal-message {
      font-size: 0.9rem;
      color: #64748b;
      margin: 0 0 20px;
      line-height: 1.5;
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 20px;
    }

    .modal-form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .modal-form-label {
      font-size: 0.85rem;
      font-weight: 500;
      color: #475569;
    }

    .modal-form-input {
      padding: 10px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9rem;
      font-family: 'Inter', sans-serif;
      color: #1e293b;
      transition: border-color 0.2s;
      outline: none;
      background: #f8fafc;
    }

    .modal-form-input:focus {
      border-color: #1a3a4a;
      background: white;
    }

    .modal-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .modal-checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      color: #1e293b;
      transition: background 0.15s;
    }

    .modal-checkbox-label:hover {
      background: #f1f5f9;
    }

    .modal-checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #1a3a4a;
      cursor: pointer;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 4px;
    }

    .modal-btn {
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 500;
      font-family: 'Inter', sans-serif;
      cursor: pointer;
      border: none;
      transition: background 0.2s, transform 0.1s;
    }

    .modal-btn:active {
      transform: scale(0.98);
    }

    .modal-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .modal-btn-cancel {
      background: transparent;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    .modal-btn-cancel:hover {
      background: #f1f5f9;
    }

    .modal-btn-primary {
      background: #1a3a4a;
      color: white;
    }

    .modal-btn-primary:hover {
      background: #15303d;
    }

    .modal-btn-danger {
      background: #ef4444;
      color: white;
    }

    .modal-btn-danger:hover {
      background: #dc2626;
    }

    .modal-btn-warning {
      background: #f59e0b;
      color: white;
    }

    .modal-btn-warning:hover {
      background: #d97706;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `],
})
export class ModalComponent implements OnInit, OnDestroy {
  config: ModalConfig | null = null;
  formValues: Record<string, any> = {};
  private sub?: Subscription;

  constructor(private modalService: ModalService) {}

  ngOnInit() {
    this.sub = this.modalService.modal$.subscribe(config => {
      this.config = config;
      if (config?.inputs) {
        this.formValues = {};
        config.inputs.forEach(input => {
          this.formValues[input.key] = input.value ?? (input.type === 'checkbox' ? false : '');
        });
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.config) this.onCancel();
  }

  isInputVisible(input: ModalInput): boolean {
    if (!input.visibleWhen) return true;
    const depValue = this.formValues[input.visibleWhen.key];
    return input.visibleWhen.values.includes(depValue);
  }

  get isFormValid(): boolean {
    if (!this.config?.inputs) return true;
    return this.config.inputs
      .filter(input => input.required && this.isInputVisible(input))
      .every(input => {
        const val = this.formValues[input.key];
        if (input.type === 'checkbox') return true;
        return val !== undefined && val !== null && String(val).trim() !== '';
      });
  }

  onConfirm() {
    if (!this.config) return;
    const resolve = this.config.resolve;
    if (this.config.type === 'confirm') {
      resolve?.(true);
    } else if (this.config.type === 'prompt') {
      resolve?.(this.formValues);
    } else {
      resolve?.(undefined);
    }
    this.modalService.close();
  }

  onCancel() {
    if (!this.config) return;
    const resolve = this.config.resolve;
    if (this.config.type === 'confirm') {
      resolve?.(false);
    } else if (this.config.type === 'prompt') {
      resolve?.(null);
    } else {
      resolve?.(undefined);
    }
    this.modalService.close();
  }
}
