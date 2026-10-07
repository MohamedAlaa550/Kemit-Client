import { ChangeDetectionStrategy, Component, OnDestroy, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { TranslationService } from '../../../Core/I18n/translation.service';
import { AuthService } from '../../../Core/Services/auth.service';
import { NotificationService } from '../../../Core/Services/notification.service';

@Component({
  selector: 'app-phone-verification',
  imports: [ReactiveFormsModule],
  templateUrl: './phone-verification.component.html',
  styleUrl: './phone-verification.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneVerificationComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly notices = inject(NotificationService);
  readonly i18n = inject(TranslationService);
  readonly verified = output<void>();
  readonly codeRequested = signal(false);
  readonly submitting = signal(false);
  readonly resendIn = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  readonly phoneForm = this.fb.nonNullable.group({
    phoneNumber: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
  });
  readonly otpForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  text(ar: string, en: string) { return this.i18n.locale() === 'ar' ? ar : en; }

  requestCode() {
    if (this.phoneForm.invalid || this.submitting() || this.resendIn() > 0) {
      this.phoneForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.auth.requestPhoneLinkOtp(this.phoneForm.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({ next: () => {
        this.codeRequested.set(true);
        this.startCooldown();
        this.notices.show(this.text('تم إرسال رمز التحقق على واتساب.', 'Verification code sent on WhatsApp.'), 'success');
      }});
  }

  verifyCode() {
    if (this.otpForm.invalid || this.submitting()) { this.otpForm.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.auth.verifyPhoneLinkOtp({
      phoneNumber: this.phoneForm.controls.phoneNumber.value,
      code: this.otpForm.controls.code.value,
    }).pipe(finalize(() => this.submitting.set(false))).subscribe({ next: () => {
      this.notices.show(this.text('تم تأكيد رقم واتساب. يمكنك الآن نشر إعلانك.', 'WhatsApp verified. You can now publish your listing.'), 'success');
      this.verified.emit();
    }});
  }

  changeNumber() {
    this.codeRequested.set(false);
    this.otpForm.reset();
  }

  ngOnDestroy() { if (this.timer) clearInterval(this.timer); }

  private startCooldown() {
    this.resendIn.set(60);
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.resendIn.update(value => Math.max(0, value - 1));
      if (!this.resendIn() && this.timer) clearInterval(this.timer);
    }, 1000);
  }
}
