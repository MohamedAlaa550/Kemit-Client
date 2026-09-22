import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../Core/Services/auth.service';
import { NotificationService } from '../../../Core/Services/notification.service';
import { SeoService } from '../../../Core/Services/seo.service';
import { GoogleSignInComponent } from '../../../Shared/Components/google-sign-in/google-sign-in.component';
import { TranslatePipe } from '../../../Shared/Pipes/translate.pipe';
import { TranslationService } from '../../../Core/I18n/translation.service';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, GoogleSignInComponent, TranslatePipe],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notices = inject(NotificationService);
  private i18n = inject(TranslationService);
  readonly submitting = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  constructor() {
    inject(SeoService).update('تسجيل الدخول', 'سجل دخولك إلى حساب كيميت.', '/auth/login');
  }
  submit() {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.notices.show(this.i18n.translate('welcomeBack'), 'success');
          void this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') || '/');
        },
      });
  }
}
