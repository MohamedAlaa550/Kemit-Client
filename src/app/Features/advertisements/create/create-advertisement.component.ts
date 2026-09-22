import { isPlatformBrowser } from '@angular/common';
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
import { Router, RouterLink } from '@angular/router';
import { AdvertisementsService } from '../../../Core/Services/advertisements.service';
import { LocationsService } from '../../../Core/Services/locations.service';
import { NotificationService } from '../../../Core/Services/notification.service';
import { SeoService } from '../../../Core/Services/seo.service';
import { LocationOption } from '../../../Core/Models/api.models';
import { TranslatePipe } from '../../../Shared/Pipes/translate.pipe';

@Component({
  selector: 'app-create-advertisement',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './create-advertisement.component.html',
  styleUrl: './create-advertisement.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAdvertisementComponent implements AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly adsService = inject(AdvertisementsService);
  private readonly locationsService = inject(LocationsService);
  private readonly notices = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private map?: Map;
  private marker?: Marker;
  private setMapLocation?: (latitude: number, longitude: number, zoom?: number) => void;
  private locationRequestId = 0;
  readonly governorates = signal<LocationOption[]>([]);
  readonly cities = signal<LocationOption[]>([]);
  readonly images = signal<File[]>([]);
  readonly previews = signal<{ file: File; url: string }[]>([]);
  readonly submitting = signal(false);
  readonly propertyTypes = [
    { value: 'Apartment', labelKey: 'propertyApartment' },
    { value: 'House', labelKey: 'propertyHouse' },
    { value: 'CommercialStore', labelKey: 'propertyCommercialStore' },
    { value: 'Office', labelKey: 'propertyOffice' },
    { value: 'chalet', labelKey: 'propertyChalet' },
    { value: 'Warehouse', labelKey: 'propertyWarehouse' },
    { value: 'Land', labelKey: 'propertyLand' },
    { value: 'Villa', labelKey: 'propertyVilla' },
    { value: 'Duplex', labelKey: 'propertyDuplex' },
  ] as const;
  readonly form = this.fb.nonNullable.group({
    publisherType: [1, Validators.required],
    type: [0, Validators.required],
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(3000)]],
    price: [0, [Validators.required, Validators.min(1)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
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
  });

  constructor() {
    inject(SeoService).update(
      'إنشاء إعلان عقاري',
      'انشر عقارك للبيع أو الإيجار على كيميت.',
      '/properties/create',
    );
    this.locationsService
      .getGovernorates()
      .subscribe({ next: (value) => this.governorates.set(value), error: () => {} });
  }

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    const L = await import('leaflet');
    const initial: L.LatLngExpression = [30.0444, 31.2357];
    this.map = L.map('property-map').setView(initial, 7);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
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
    setTimeout(() => this.map?.invalidateSize(), 0);
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
    if (!this.showsNumberOfFloors()) this.form.controls.numberOfFloors.setValue(0);
  }

  showsNumberOfFloors() {
    return ['House', 'CommercialStore', 'chalet', 'Villa'].includes(
      this.form.controls.propertyType.value,
    );
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

  ngOnDestroy() {
    this.previews().forEach((item) => URL.revokeObjectURL(item.url));
    this.map?.remove();
  }

  private refreshPreviews() {
    this.previews().forEach((item) => URL.revokeObjectURL(item.url));
    this.previews.set(this.images().map((file) => ({ file, url: URL.createObjectURL(file) })));
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.images().length < 3 || this.submitting()) return;
    this.submitting.set(true);
    const data = new FormData();
    const value = this.form.getRawValue();
    Object.entries(value).forEach(([key, item]) => {
      if (key !== 'governorateId' && item !== '' && item !== null && item !== undefined)
        data.append(key[0].toUpperCase() + key.slice(1), String(item));
    });
    this.images().forEach((file) => data.append('Images', file, file.name));
    this.adsService.create(data).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notices.show(
          'تم استلام إعلانك وهو الآن قيد المراجعة. سنخبرك فور الموافقة عليه.',
          'info',
          5000,
        );
        void this.router.navigate(['/profile']);
      },
      error: () => this.submitting.set(false),
    });
  }
}
