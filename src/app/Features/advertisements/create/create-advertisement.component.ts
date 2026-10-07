import { DatePipe, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import type { Map, Marker } from 'leaflet';
import { ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AdvertisementsService } from '../../../Core/Services/advertisements.service';
import { LocationsService } from '../../../Core/Services/locations.service';
import { NotificationService } from '../../../Core/Services/notification.service';
import { SeoService } from '../../../Core/Services/seo.service';
import { LocationOption } from '../../../Core/Models/api.models';
import { TranslatePipe } from '../../../Shared/Pipes/translate.pipe';
import { ThousandsSeparatorDirective } from '../../../Shared/Directives/thousands-separator.directive';
import { TranslationService } from '../../../Core/I18n/translation.service';
import { LocationNamePipe } from '../../../Shared/Pipes/location-name.pipe';
import { AdvertisingAccount } from '../../../Core/Models/api.models';
import { AdvertisingBillingService } from '../../../Core/Services/advertising-billing.service';
import { AuthService } from '../../../Core/Services/auth.service';
import { PhoneVerificationComponent } from '../../../Shared/Components/phone-verification/phone-verification.component';

@Component({
  selector: 'app-create-advertisement',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, ThousandsSeparatorDirective, LocationNamePipe, DatePipe, PhoneVerificationComponent],
  templateUrl: './create-advertisement.component.html',
  styleUrl: './create-advertisement.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAdvertisementComponent implements AfterViewInit, OnDestroy {
  readonly i18n = inject(TranslationService);
  private readonly fb = inject(FormBuilder);
  private readonly adsService = inject(AdvertisementsService);
  private readonly locationsService = inject(LocationsService);
  private readonly notices = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly billing = inject(AdvertisingBillingService);
  private readonly auth = inject(AuthService);
  private map?: Map;
  private marker?: Marker;
  private mapResizeObserver?: ResizeObserver;
  private setMapLocation?: (latitude: number, longitude: number, zoom?: number) => void;
  private locationRequestId = 0;
  readonly governorates = signal<LocationOption[]>([]);
  readonly cities = signal<LocationOption[]>([]);
  readonly images = signal<File[]>([]);
  readonly existingImages = signal<string[]>([]);
  readonly previews = signal<{ file: File; url: string }[]>([]);
  readonly submitting = signal(false);
  readonly loadingAdvertisement = signal(false);
  readonly advertisingAccount = signal<AdvertisingAccount | null>(null);
  readonly loadingEntitlements = signal(false);
  readonly checkingPhone = signal(true);
  readonly phoneVerified = signal(false);
  readonly advertisementId = Number(this.route.snapshot.paramMap.get('id')) || null;
  readonly editMode = this.advertisementId !== null;
  readonly residentialPropertyTypes = [
    { value: 'Apartment', labelKey: 'propertyApartment' },
    { value: 'Villa', labelKey: 'propertyVilla' },
    { value: 'Duplex', labelKey: 'propertyDuplex' },
    { value: 'House', labelKey: 'propertyHouse' },
    { value: 'chalet', labelKey: 'propertyChalet' },
    { value: 'Studio', labelKey: 'propertyStudio' },
    { value: 'HotelUnit', labelKey: 'propertyHotelUnit' },
    { value: 'Penthouse', labelKey: 'propertyPenthouse' },
    { value: 'TownHouse', labelKey: 'propertyTownHouse' },
    { value: 'TwinHouse', labelKey: 'propertyTwinHouse' },
  ] as const;
  readonly commercialPropertyTypes = [
    { value: 'Office', labelKey: 'propertyOffice' },
    { value: 'MedicalClinic', labelKey: 'propertyMedicalClinic' },
    { value: 'CommercialBuilding', labelKey: 'propertyCommercialBuilding' },
    { value: 'Warehouse', labelKey: 'propertyWarehouse' },
    { value: 'Factory', labelKey: 'propertyFactory' },
    { value: 'Garage', labelKey: 'propertyGarage' },
    { value: 'RestaurantOrCafe', labelKey: 'propertyRestaurantOrCafe' },
    { value: 'Land', labelKey: 'propertyLand' },
  ] as const;
  readonly form = this.fb.nonNullable.group({
    publisherType: [1, Validators.required],
    type: [0, Validators.required],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(3000)]],
    price: [0, [Validators.required, Validators.min(1)]],
    paymentMethod: ['Cash'],
    downPayment: [0, Validators.min(0)],
    installmentYears: [1, Validators.min(1)],
    monthlyInstallment: [1, Validators.min(1)],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
    activityType: ['Residential', Validators.required],
    rentalPeriod: ['Monthly'],
    furnishingStatus: ['Furnished'],
    propertyType: ['Apartment', Validators.required],
    numberOfBedrooms: [0, Validators.min(0)],
    numberOfBathrooms: [1, [Validators.required, Validators.min(1)]],
    numberOfFloors: [0, Validators.min(0)],
    floorNumber: [0, Validators.min(0)],
    area: [0, [Validators.required, Validators.min(1)]],
    latitude: [''],
    longitude: [''],
    governorateId: [0, [Validators.required, Validators.min(1)]],
    citiesId: [0, [Validators.required, Validators.min(1)]],
    advertisingPurchaseId: [null as number | null],
  });

  constructor() {
    inject(SeoService).updateLocalized(
      'إنشاء إعلان عقاري',
      'Create property listing',
      'انشر عقارك للبيع أو الإيجار على كيميت.',
      'List your property for sale or rent on Kemet.',
      '/properties/create',
    );
    this.propertyTypeChanged();
    if (this.editMode) {
      this.phoneVerified.set(true);
      this.checkingPhone.set(false);
    } else {
      this.checkPhoneVerification();
    }
    this.locationsService.getGovernorates().subscribe({
      next: (value) => {
        this.governorates.set(value);
        if (this.editMode) this.loadAdvertisement();
      },
      error: () => {},
    });
  }

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    const L = await import('leaflet');
    const initial: L.LatLngExpression = [30.0444, 31.2357];
    this.map = L.map('property-map').setView(initial, 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: 'abc',
      crossOrigin: true,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
    const icon = L.divIcon({
      className: '',
      html: '<span style="display:block;width:28px;height:38px;border:3px solid #070707;border-radius:50% 50% 50% 0;background:#e3b84f;box-shadow:0 6px 18px #000;transform:rotate(-45deg)"></span>',
      iconSize: [28, 38],
      iconAnchor: [14, 38],
    });
    const setLocation = (latitude: number, longitude: number, center = true, zoom?: number) => {
      this.form.patchValue({ latitude: latitude.toFixed(7), longitude: longitude.toFixed(7) });
      if (!this.marker) {
        this.marker = L.marker([latitude, longitude], { draggable: true, icon }).addTo(this.map!);
        this.marker.on('dragend', (event) => {
          const point = event.target.getLatLng();
          setLocation(point.lat, point.lng, false);
        });
      } else this.marker.setLatLng([latitude, longitude]);
      if (center) this.map?.flyTo([latitude, longitude], zoom ?? this.map.getZoom(), { duration: .8 });
    };
    this.setMapLocation = (latitude, longitude, zoom = 13) => setLocation(latitude, longitude, true, zoom);
    this.map.on('click', (event) => setLocation(event.latlng.lat, event.latlng.lng));
    const savedLatitude = Number(this.form.controls.latitude.value);
    const savedLongitude = Number(this.form.controls.longitude.value);
    if (Number.isFinite(savedLatitude) && Number.isFinite(savedLongitude) && (savedLatitude || savedLongitude))
      setLocation(savedLatitude, savedLongitude, true, 13);
    const mapElement = document.getElementById('property-map');
    if (mapElement && typeof ResizeObserver !== 'undefined') {
      this.mapResizeObserver = new ResizeObserver(() => this.map?.invalidateSize({ debounceMoveend: true }));
      this.mapResizeObserver.observe(mapElement);
    }
    requestAnimationFrame(() => this.map?.invalidateSize());
  }

  governorateChanged() {
    const id = Number(this.form.controls.governorateId.value);
    this.form.controls.citiesId.setValue(0);
    this.cities.set([]);
    if (id) {
      const governorate = this.governorates().find(item => item.id === id);
      if (governorate) this.focusPlace(governorate.name, 10);
      this.locationsService
        .getCities(id)
        .subscribe({ next: (value) => this.cities.set(value), error: () => {} });
    }
  }

  cityChanged() {
    const cityId = Number(this.form.controls.citiesId.value);
    const city = this.cities().find(item => item.id === cityId);
    const governorate = this.governorates().find(
      item => item.id === Number(this.form.controls.governorateId.value),
    );
    if (city) this.focusPlace(`${city.name}, ${governorate?.name ?? ''}`, 13);
  }

  private focusPlace(place: string, zoom: number) {
    const requestId = ++this.locationRequestId;
    this.locationsService.geocode(place).subscribe({
      next: results => {
        if (requestId !== this.locationRequestId || !results.length) return;
        const latitude = Number(results[0].lat);
        const longitude = Number(results[0].lon);
        if (Number.isFinite(latitude) && Number.isFinite(longitude))
          this.setMapLocation?.(latitude, longitude, zoom);
      },
      error: () => {},
    });
  }

  propertyTypeChanged() {
    if (!this.showsBedrooms()) this.form.controls.numberOfBedrooms.setValue(0);
    if (!this.showsBathrooms()) {
      this.form.controls.numberOfBathrooms.setValue(0);
      this.form.controls.numberOfBathrooms.clearValidators();
    } else {
      this.form.controls.numberOfBathrooms.setValidators([Validators.required, Validators.min(1)]);
      if (this.form.controls.numberOfBathrooms.value < 1) this.form.controls.numberOfBathrooms.setValue(1);
    }
    if (!this.showsNumberOfFloors()) this.form.controls.numberOfFloors.setValue(0);
    if (!this.showsFloorNumber()) this.form.controls.floorNumber.setValue(0);
    this.form.controls.numberOfBathrooms.updateValueAndValidity({ emitEvent: false });
  }

  activityTypeChanged() {
    const firstType = this.availablePropertyTypes()[0].value;
    this.form.controls.propertyType.setValue(firstType);
    this.propertyTypeChanged();
  }

  showsResidentialRentalOptions() {
    return Number(this.form.controls.type.value) === 1 &&
      this.form.controls.activityType.value === 'Residential';
  }

  showsSalePaymentOptions() {
    return Number(this.form.controls.type.value) === 0;
  }

  showsInstallmentFields() {
    return this.showsSalePaymentOptions() && this.form.controls.paymentMethod.value === 'Installment';
  }

  installmentValuesInvalid() {
    if (!this.showsInstallmentFields()) return false;
    const price = Number(this.form.controls.price.value);
    const downPayment = Number(this.form.controls.downPayment.value);
    return downPayment < 0 || downPayment >= price ||
      Number(this.form.controls.installmentYears.value) <= 0 ||
      Number(this.form.controls.monthlyInstallment.value) <= 0 ||
      Number(this.form.controls.monthlyInstallment.value) > price;
  }

  downPaymentInvalid() {
    return Number(this.form.controls.downPayment.value) >= Number(this.form.controls.price.value);
  }

  monthlyInstallmentInvalid() {
    return Number(this.form.controls.monthlyInstallment.value) > Number(this.form.controls.price.value);
  }

  availablePropertyTypes() {
    return this.form.controls.activityType.value === 'Commercial'
      ? this.commercialPropertyTypes
      : this.residentialPropertyTypes;
  }

  showsNumberOfFloors() {
    return ['House', 'Villa', 'TownHouse', 'TwinHouse', 'Office', 'CommercialBuilding', 'RestaurantOrCafe'].includes(
      this.form.controls.propertyType.value,
    );
  }

  showsFloorNumber() {
    return !['chalet', 'Villa', 'House', 'TownHouse', 'TwinHouse', 'CommercialBuilding', 'Land', 'Warehouse', 'Factory', 'Garage'].includes(this.form.controls.propertyType.value);
  }

  showsBedrooms() {
    return !['CommercialBuilding', 'Land', 'Warehouse', 'Factory', 'Garage', 'RestaurantOrCafe'].includes(this.form.controls.propertyType.value);
  }

  showsBathrooms() {
    return !['CommercialBuilding', 'Land', 'Warehouse', 'Factory', 'Garage'].includes(this.form.controls.propertyType.value);
  }

  filesChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    const selected = Array.from(input.files ?? []);
    const merged = [...this.images()];
    for (const file of selected) {
      const exists = merged.some(
        (current) =>
          current.name === file.name &&
          current.size === file.size &&
          current.lastModified === file.lastModified,
      );
      if (!exists && merged.length < 10) merged.push(file);
    }
    this.images.set(merged);
    this.refreshPreviews();
    input.value = '';
  }

  removeImage(index: number) {
    this.images.update((files) => files.filter((_, current) => current !== index));
    this.refreshPreviews();
  }

  existingImageUrl(path: string) {
    return path.startsWith('http') ? path : `${environment.apiOrigin}/${path.replace(/^\//, '')}`;
  }

  private loadAdvertisement() {
    if (!this.advertisementId) return;
    this.loadingAdvertisement.set(true);
    this.adsService.getById(this.advertisementId).subscribe({
      next: (ad) => {
        const governorate = this.governorates().find(item => item.name === ad.governorateName);
        this.form.patchValue({
          publisherType: Number(ad.publisherType), type: Number(ad.advertisementType), title: ad.title,
          description: ad.description, price: ad.price, paymentMethod: this.enumName(ad.paymentMethod, ['Cash','Installment']),
          downPayment: ad.downPayment ?? 0, installmentYears: ad.installmentYears ?? 1,
          monthlyInstallment: ad.monthlyInstallment ?? 1, phoneNumber: ad.phoneNumber,
          activityType: this.enumName(ad.activityType, ['Residential','Commercial']),
          rentalPeriod: this.enumName(ad.rentalPeriod, ['Monthly','Daily']),
          furnishingStatus: this.enumName(ad.furnishingStatus, ['Furnished','Unfurnished']),
          propertyType: this.enumName(ad.propertyType, ['Apartment','House','CommercialStore','Office','chalet','Warehouse','Land','Villa','Duplex','Studio','HotelUnit','MedicalClinic','CommercialBuilding','Factory','Garage','RestaurantOrCafe','Penthouse','TownHouse','TwinHouse']),
          numberOfBedrooms: ad.numberOfBedrooms ?? 0, numberOfBathrooms: ad.numberOfBathrooms,
          numberOfFloors: ad.numberOfFloors ?? 0, floorNumber: ad.floorNumber ?? 0, area: ad.area,
          latitude: ad.latitude == null ? '' : String(ad.latitude), longitude: ad.longitude == null ? '' : String(ad.longitude),
          governorateId: governorate?.id ?? 0,
        });
        this.propertyTypeChanged();
        this.existingImages.set(ad.images ?? []);
        if (ad.latitude != null && ad.longitude != null) this.setMapLocation?.(Number(ad.latitude), Number(ad.longitude));
        if (!governorate) { this.loadingAdvertisement.set(false); return; }
        this.locationsService.getCities(governorate.id).subscribe({
          next: cities => {
            this.cities.set(cities);
            this.form.controls.citiesId.setValue(cities.find(item => item.name === ad.cityName)?.id ?? 0);
            this.loadingAdvertisement.set(false);
          },
          error: () => this.loadingAdvertisement.set(false),
        });
      },
      error: () => { this.loadingAdvertisement.set(false); void this.router.navigate(['/profile']); },
    });
  }

  private enumName(value: string | number | undefined, names: string[]) {
    return typeof value === 'number' ? (names[value] ?? names[0]) : (String(value || names[0]));
  }

  ngOnDestroy() {
    this.previews().forEach((item) => URL.revokeObjectURL(item.url));
    this.mapResizeObserver?.disconnect();
    this.map?.remove();
  }

  private refreshPreviews() {
    this.previews().forEach((item) => URL.revokeObjectURL(item.url));
    this.previews.set(this.images().map((file) => ({ file, url: URL.createObjectURL(file) })));
  }

  submit() {
    this.form.markAllAsTouched();
    if (!this.phoneVerified() || this.form.invalid || this.installmentValuesInvalid() || (!this.editMode && !this.canPublish()) || (!this.editMode && this.images().length < 3) || (this.editMode && this.images().length > 0 && this.images().length < 3) || this.submitting()) return;
    this.submitting.set(true);
    const data = new FormData();
    const value = this.form.getRawValue();
    Object.entries(value).forEach(([key, item]) => {
      if ((key === 'rentalPeriod' || key === 'furnishingStatus') && !this.showsResidentialRentalOptions()) return;
      if (key === 'paymentMethod' && !this.showsSalePaymentOptions()) return;
      if (['downPayment', 'installmentYears', 'monthlyInstallment'].includes(key) && !this.showsInstallmentFields()) return;
      if (key !== 'governorateId' && item !== '' && item !== null && item !== undefined)
        data.append(key[0].toUpperCase() + key.slice(1), String(item));
    });
    this.images().forEach((file) => data.append('Images', file, file.name));
    const request = this.editMode ? this.adsService.update(this.advertisementId!, data) : this.adsService.create(data);
    request.subscribe({
      next: () => {
        this.submitting.set(false);
        this.notices.show(
          this.editMode
            ? 'تم تحديث الإعلان وتحويله إلى قيد المراجعة مرة أخرى.'
            : 'تم استلام إعلانك وهو الآن قيد المراجعة. سنخبرك فور الموافقة عليه.',
          'info',
          5000,
        );
        void this.router.navigate(['/profile']);
      },
      error: () => this.submitting.set(false),
    });
  }

  canPublish() {
    if (this.editMode) return true;
    const account = this.advertisingAccount();
    if (!account) return false;
    return account.isUnlimitedPublishing || account.freeAdvertisementsRemaining > 0 || account.activePurchases.length > 0;
  }

  selectFreePublishing() { this.form.controls.advertisingPurchaseId.setValue(null); }

  phoneVerificationCompleted() {
    this.phoneVerified.set(true);
    this.loadAdvertisingAccount();
    this.auth.getCurrentUser().subscribe({ error: () => {} });
    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  private checkPhoneVerification() {
    this.auth.getCurrentUser().subscribe({
      next: user => {
        const verified = user.phoneNumberConfirmed === true || this.auth.isAdministrator();
        this.phoneVerified.set(verified);
        this.checkingPhone.set(false);
        if (verified) this.loadAdvertisingAccount();
      },
      error: () => this.checkingPhone.set(false),
    });
  }

  private loadAdvertisingAccount() {
    this.loadingEntitlements.set(true);
    this.billing.getAccount().subscribe({
      next: account => {
        this.advertisingAccount.set(account);
        if (!account.isUnlimitedPublishing && account.freeAdvertisementsRemaining === 0 && account.activePurchases.length)
          this.form.controls.advertisingPurchaseId.setValue(account.activePurchases[0].id);
        this.loadingEntitlements.set(false);
      },
      error: () => this.loadingEntitlements.set(false),
    });
  }
}
