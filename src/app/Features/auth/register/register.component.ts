import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslationService } from '../../../Core/I18n/translation.service';
import { AuthService } from '../../../Core/Services/auth.service';
import { NotificationService } from '../../../Core/Services/notification.service';
import { SeoService } from '../../../Core/Services/seo.service';
import { GoogleSignInComponent } from '../../../Shared/Components/google-sign-in/google-sign-in.component';
import { matchFields } from '../../../Shared/Validators/form.validators';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, GoogleSignInComponent],
  templateUrl: './register.component.html',
  styles: [`
    .two-columns{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}
    .password-hint{margin-top:.35rem}
    @media(max-width:520px){.two-columns{grid-template-columns:1fr}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notices = inject(NotificationService);
  readonly i18n = inject(TranslationService);
  readonly submitting = signal(false);
  readonly avatar = signal<File | null>(null);
  readonly passwordVisible = signal(false);
  readonly confirmPasswordVisible = signal(false);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)]],
    confirmPassword: ['', Validators.required],
  }, { validators: matchFields('password', 'confirmPassword') });

  constructor() {
    inject(SeoService).updateLocalized(
      'إنشاء حساب',
      'Create account',
      'أنشئ حساب كيميت بالبريد الإلكتروني أو Google، وأكد رقمك عند نشر إعلان.',
      'Create your Kemet account with email or Google, then verify your number when publishing.',
      '/auth/register',
    );
  }

  text(ar: string, en: string): string { return this.i18n.locale() === 'ar' ? ar : en; }

  file(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0] ?? null;
    if (!selected) { this.avatar.set(null); return; }
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowedTypes.has(selected.type)) {
      this.avatar.set(null);
      input.value = '';
      this.notices.show(this.text('اختر صورة بصيغة JPG أو PNG أو WebP.', 'Choose a JPG, PNG, or WebP image.'), 'error');
      return;
    }
    if (selected.size > 2 * 1024 * 1024) {
      this.avatar.set(null);
      input.value = '';
      this.notices.show(this.text('حجم الصورة يجب ألا يتجاوز 2 ميجابايت.', 'The image must not exceed 2 MB.'), 'error');
      return;
    }
    this.avatar.set(selected);
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.auth.register({ ...this.form.getRawValue(), avatar: this.avatar() })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.notices.show(
            this.text('تم إنشاء حسابك. راجع بريدك لتأكيده.', 'Your account was created. Check your email to confirm it.'),
            'success',
          );
          void this.router.navigateByUrl('/');
        },
      });
  }
}
