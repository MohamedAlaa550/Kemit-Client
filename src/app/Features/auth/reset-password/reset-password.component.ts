import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../Core/Services/auth.service';
import { NotificationService } from '../../../Core/Services/notification.service';
import { TranslationService } from '../../../Core/I18n/translation.service';
import { matchFields } from '../../../Shared/Validators/form.validators';

@Component({ selector: 'app-reset-password', imports: [ReactiveFormsModule, RouterLink], templateUrl: './reset-password.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder); private readonly auth = inject(AuthService); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); private readonly notices = inject(NotificationService);
  readonly i18n = inject(TranslationService); readonly submitting = signal(false);
  readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly validLink = !!this.email && !!this.token;
  readonly form = this.fb.nonNullable.group({ newPassword: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/)]], confirmNewPassword: ['', Validators.required] }, { validators: matchFields('newPassword', 'confirmNewPassword') });
  text(ar: string, en: string) { return this.i18n.locale() === 'ar' ? ar : en; }
  submit() { if (!this.validLink || this.form.invalid || this.submitting()) { this.form.markAllAsTouched(); return; } this.submitting.set(true); this.auth.resetPassword({ email: this.email, token: this.token, ...this.form.getRawValue() }).pipe(finalize(() => this.submitting.set(false))).subscribe({ next: () => { this.notices.show(this.text('تم تغيير كلمة المرور بنجاح.','Password changed successfully.'), 'success'); void this.router.navigateByUrl('/auth/login'); } }); }
}
