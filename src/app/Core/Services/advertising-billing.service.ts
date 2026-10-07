import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  AdvertisingAccount,
  AdvertisingCheckout,
  AdvertisingPaymentResult,
  AdvertisingPlan,
} from '../Models/api.models';

@Injectable({ providedIn: 'root' })
export class AdvertisingBillingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/AdvertisingBilling`;

  getPlans() {
    return this.http.get<AdvertisingPlan[]>(`${this.baseUrl}/plans`);
  }

  getAccount() {
    return this.http.get<AdvertisingAccount>(`${this.baseUrl}/account`);
  }

  createCheckout(planType: number) {
    return this.http.post<AdvertisingCheckout>(`${this.baseUrl}/checkout`, { planType });
  }

  getPaymentResult(reference: string) {
    return this.http.get<AdvertisingPaymentResult>(`${this.baseUrl}/payments/${encodeURIComponent(reference)}`);
  }
}
