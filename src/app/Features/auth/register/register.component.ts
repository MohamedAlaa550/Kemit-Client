import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, finalize, switchMap } from 'rxjs';
import { AuthService } from '../../../Core/Services/auth.service';
import { NotificationService } from '../../../Core/Services/notification.service';
import { SeoService } from '../../../Core/Services/seo.service';
import { GoogleSignInComponent } from '../../../Shared/Components/google-sign-in/google-sign-in.component';
import { matchFields } from '../../../Shared/Validators/form.validators';
import { TranslatePipe } from '../../../Shared/Pipes/translate.pipe';
import { TranslationService } from '../../../Core/I18n/translation.service';
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, GoogleSignInComponent, TranslatePipe],
  templateUrl: './register.component.html',
  styles: [
    `
      .password-field {
        position: relative;
      }
      .password-field .form-control {
        padding-inline-end: 3.2rem;
      }
      .password-toggle {
        position: absolute;
        top: 50%;
        inset-inline-end: 0.65rem;
        display: grid;
        width: 36px;
        height: 36px;
        place-items: center;
        transform: translateY(-50%);
        border: 0;
        border-radius: 50%;
        background: transparent;
        color: var(--color-muted);
        cursor: pointer;
      }
      .password-toggle:hover,
      .password-toggle:focus-visible {
        background: rgba(227, 184, 79, 0.1);
        color: var(--color-primary);
      }
      .password-toggle svg {
        width: 20px;
        height: 20px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notices = inject(NotificationService);
  readonly i18n = inject(TranslationService);
  readonly submitting = signal(false);
  readonly avatar = signal<File | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly form = this.fb.nonNullable.group(
    {
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      userName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/),
        ],
      ],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchFields('password', 'confirmPassword') },
  );
  constructor() {
    inject(SeoService).update('إنشاء حساب', 'أنشئ حسابًا على كيميت.', '/auth/register');
  }
  file(e: Event) {
    this.avatar.set((e.target as HTMLInputElement).files?.[0] ?? null);
  }
  togglePassword() {
    this.showPassword.update((value) => !value);
  }
  toggleConfirmPassword() {
    this.showConfirmPassword.update((value) => !value);
  }
  submit() {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const data = new FormData();
    Object.entries(this.form.getRawValue()).forEach(([k, v]) => data.append(k, v.trim()));
    if (this.avatar()) data.append('avatar', this.avatar()!);
    this.submitting.set(true);
    this.auth
      .checkEmail(this.form.controls.email.value.trim())
      .pipe(
        switchMap((exists) => {
          if (exists) {
            this.form.controls.email.setErrors({ emailExists: true });
            this.form.controls.email.markAsTouched();
            this.notices.show(this.i18n.translate('emailExists'), 'error');
            return EMPTY;
          }
          return this.auth.register(data);
        }),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: () => {
          this.notices.show(this.i18n.translate('accountCreated'), 'success');
          void this.router.navigateByUrl('/');
        },
      });
  }
}
