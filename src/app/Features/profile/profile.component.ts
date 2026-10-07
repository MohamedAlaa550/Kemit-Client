import { DatePipe, DecimalPipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Advertisement, AdvertisingAccount } from '../../Core/Models/api.models';
import { AdvertisingBillingService } from '../../Core/Services/advertising-billing.service';
import { AdvertisementsService } from '../../Core/Services/advertisements.service';
import { AuthService } from '../../Core/Services/auth.service';
import { NotificationService } from '../../Core/Services/notification.service';
import { SeoService } from '../../Core/Services/seo.service';
import { TranslationService } from '../../Core/I18n/translation.service';
import { TranslatePipe } from '../../Shared/Pipes/translate.pipe';
import { finalize } from 'rxjs';
import { LocationNamePipe } from '../../Shared/Pipes/location-name.pipe';

@Component({
  selector: 'app-profile',
  imports: [DecimalPipe, DatePipe, RouterLink, TranslatePipe, LocationNamePipe, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly adsService = inject(AdvertisementsService);
  private readonly notices = inject(NotificationService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly i18n = inject(TranslationService);
  readonly ads = signal<Advertisement[]>([]);
  readonly advertisingAccount = signal<AdvertisingAccount | null>(null);
  readonly loadingAds = signal(true);
  readonly advertisementToDelete = signal<Advertisement | null>(null);
  readonly deletingAdvertisement = signal(false);
  readonly phoneVerificationStep = signal<1 | 2>(1);
  readonly verifyingPhone = signal(false);
  readonly editingProfile = signal(false);
  readonly savingProfile = signal(false);
  readonly selectedAvatar = signal<File | null>(null);
  private readonly fb = inject(FormBuilder);
  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
  });
  readonly phoneVerificationForm = this.fb.nonNullable.group({
    phoneNumber: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
    code: [''],
  });
  readonly totalAds = computed(() => this.ads().length);
  readonly pendingAds = computed(
    () => this.ads().filter((ad) => this.statusKey(ad.status) === 'pending').length,
  );
  readonly approvedAds = computed(() =>
    this.ads().filter((ad) => this.statusKey(ad.status) === 'approved'),
  );
  readonly rejectedAds = computed(
    () => this.ads().filter((ad) => this.statusKey(ad.status) === 'rejected').length,
  );
  readonly avatar = computed(() => {
    const url = this.auth.currentUser()?.avatarUrl?.trim();
    if (!url) return 'assets/brand/kemit-logo.jpeg';
    try {
      if (/^https?:\/\//i.test(url)) return url;
      const path = url;
      return `${environment.apiOrigin}/${path.replace(/^\//, '')}`;
    } catch {
      return 'assets/brand/kemit-logo.jpeg';
    }
  });

  avatarLoadFailed(event: Event) {
    const image = event.currentTarget as HTMLImageElement;
    image.onerror = null;
    image.src = 'assets/brand/kemit-logo.jpeg';
  }

  startProfileEdit() {
    const user = this.auth.currentUser();
    if (!user) return;
    this.profileForm.setValue({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phoneNumber: user.phoneNumber ?? '',
    });
    this.selectedAvatar.set(null);
    this.editingProfile.set(true);
  }

  cancelProfileEdit() {
    if (this.savingProfile()) return;
    this.selectedAvatar.set(null);
    this.editingProfile.set(false);
  }

  profileAvatarChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file && file.size > 2 * 1024 * 1024) {
      input.value = '';
      this.selectedAvatar.set(null);
      this.notices.show(this.i18n.locale() === 'ar' ? 'حجم الصورة يجب ألا يتجاوز 2 ميجابايت.' : 'The image must not exceed 2 MB.', 'error');
      return;
    }
    this.selectedAvatar.set(file);
  }

  saveProfile() {
    if (this.profileForm.invalid || this.savingProfile()) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const value = this.profileForm.getRawValue();
    const data = new FormData();
    data.append('firstName', value.firstName.trim());
    data.append('lastName', value.lastName.trim());
    data.append('phoneNumber', value.phoneNumber.trim());
    const avatar = this.selectedAvatar();
    if (avatar) data.append('avatar', avatar, avatar.name);
    this.savingProfile.set(true);
    this.auth.updateProfile(data).pipe(finalize(() => this.savingProfile.set(false))).subscribe({
      next: user => {
        this.phoneVerificationForm.controls.phoneNumber.setValue(user.phoneNumber ?? '');
        this.editingProfile.set(false);
        this.selectedAvatar.set(null);
        this.notices.show(this.i18n.locale() === 'ar' ? 'تم تحديث بيانات الحساب بنجاح.' : 'Profile updated successfully.', 'success');
      },
    });
  }

  requestPhoneVerification() {
    const control = this.phoneVerificationForm.controls.phoneNumber;
    if (control.invalid || this.verifyingPhone()) { control.markAsTouched(); return; }
    this.verifyingPhone.set(true);
    this.auth.requestPhoneLinkOtp({ phoneNumber: control.value }).pipe(finalize(() => this.verifyingPhone.set(false))).subscribe({
      next: () => { this.phoneVerificationStep.set(2); this.notices.show(this.i18n.locale()==='ar'?'تم إرسال رمز التحقق على واتساب.':'Verification code sent on WhatsApp.','success'); },
    });
  }

  verifyPhone() {
    const { phoneNumber, code } = this.phoneVerificationForm.getRawValue();
    if (!/^\d{6}$/.test(code) || this.verifyingPhone()) { this.phoneVerificationForm.controls.code.setErrors({ invalid: true }); return; }
    this.verifyingPhone.set(true);
    this.auth.verifyPhoneLinkOtp({ phoneNumber, code }).pipe(finalize(() => this.verifyingPhone.set(false))).subscribe({
      next: () => this.auth.getCurrentUser().subscribe({ next: () => this.notices.show(this.i18n.locale()==='ar'?'تم تأكيد رقم واتساب.':'WhatsApp number verified.','success') }),
    });
  }

  constructor() {
    inject(SeoService).updateLocalized(
      'حسابي',
      'My account',
      'بياناتك وإعلاناتك وإشعارات المراجعة على كيميت.',
      'Manage your information, listings, and review notifications on Kemet.',
      '/profile',
    );
    this.auth.getCurrentUser().subscribe({
      next: user => this.phoneVerificationForm.controls.phoneNumber.setValue(user.phoneNumber ?? ''),
      error: () => {},
    });
    inject(AdvertisingBillingService).getAccount().subscribe({ next: account => this.advertisingAccount.set(account), error: () => {} });
    this.adsService.getMine().subscribe({
      next: (ads) => {
        this.ads.set(ads);
        this.loadingAds.set(false);
        this.showNewApprovalToasts(ads);
      },
      error: () => this.loadingAds.set(false),
    });
  }

  statusKey(status: Advertisement['status']) {
    const value = String(status).toLowerCase();
    if (value === '0' || value === 'pending') return 'pending';
    if (value === '1' || value === 'approved') return 'approved';
    if (value === '2' || value === 'rejected') return 'rejected';
    return 'expired';
  }

  statusLabel(status: Advertisement['status']) {
    return this.i18n.translate(this.statusKey(status));
  }

  adImage(ad: Advertisement) {
    const path = ad.coverImage;
    return path
      ? path.startsWith('http')
        ? path
        : `${environment.apiOrigin}/${path.replace(/^\//, '')}`
      : 'assets/brand/kemit-logo.jpeg';
  }

  askToDelete(ad: Advertisement) {
    this.advertisementToDelete.set(ad);
  }

  cancelDelete() {
    if (!this.deletingAdvertisement()) this.advertisementToDelete.set(null);
  }

  confirmDelete() {
    const ad = this.advertisementToDelete();
    if (!ad || this.deletingAdvertisement()) return;
    this.deletingAdvertisement.set(true);
    this.adsService.delete(ad.id).pipe(
      finalize(() => this.deletingAdvertisement.set(false)),
    ).subscribe({
      next: () => {
        this.ads.update(items => items.filter(item => item.id !== ad.id));
        this.advertisementToDelete.set(null);
        this.notices.show(
          this.i18n.locale() === 'ar' ? 'تم حذف الإعلان بنجاح.' : 'Listing deleted successfully.',
          'success',
          3500,
        );
      },
    });
  }

  private showNewApprovalToasts(ads: Advertisement[]) {
    if (!isPlatformBrowser(this.platformId)) return;
    const storageKey = 'kemit_seen_approved_ads';
    const seen = new Set<string>(JSON.parse(localStorage.getItem(storageKey) ?? '[]'));
    let changed = false;
    for (const ad of ads.filter((item) => this.statusKey(item.status) === 'approved')) {
      const id = String(ad.id);
      if (!seen.has(id)) {
        this.notices.show(this.i18n.locale() === 'ar' ? `تهانينا! تمت الموافقة على إعلان «${ad.title}» وتم نشره بنجاح.` : `Congratulations! “${ad.title}” was approved and published.`, 'success', 5000);
        seen.add(id);
        changed = true;
      }
    }
    if (changed) localStorage.setItem(storageKey, JSON.stringify([...seen]));
  }
}
