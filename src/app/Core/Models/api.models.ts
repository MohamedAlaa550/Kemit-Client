export interface PaginatedResult<T> {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  data: T[];
}

export interface AuthResponse {
  userId: string;
  email: string;
  userName: string;
  expiresAt: string;
  roles: string[];
}

export interface User {
  id?: string;
  email: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  roles?: string[];
  isActive?: boolean;
  phoneNumberConfirmed?: boolean;
  subscriptionType?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  startingPrice: number;
  maxPrice?: number;
  paymentMethod: 'Cash' | 'Installment' | 'CashOrInstallment';
  installmentYears?: number;
  status: string;
  createdAt: string;
  deliveryDate?: string;
  developerId: number;
  developerName: string;
  developerLogoUrl?: string;
  governoratesId: number;
  governorateName: string;
  citiesId: number;
  cityName: string;
  latitude?: number;
  longitude?: number;
  videoUrl?: string;
  images: string[];
  unitsCount: number;
}

export interface HomeSliderImage {
  id: number;
  imageUrl: string;
  sortOrder: number;
}

export interface Advertisement {
  id: number;
  advertiserId?: string;
  title: string;
  description?: string;
  phoneNumber?: string;
  price: number;
  paymentMethod?: string | number;
  downPayment?: number;
  installmentYears?: number;
  monthlyInstallment?: number;
  cityName: string;
  governorateName: string;
  propertyType: string | number;
  activityType?: string | number;
  rentalPeriod?: string | number;
  furnishingStatus?: string | number;
  advertisementType: string | number;
  status: string | number;
  area: number;
  numberOfBedrooms?: number;
  numberOfBathrooms?: number;
  publisherType?: string | number;
  coverImage: string;
  images?: string[];
  advertiserName?: string;
  advertiserAvatarUrl?: string;
  advertiserRating?: number;
  advertiserRatingCount?: number;
  createdAt: string;
  isFeatured: boolean;
  promotionLevel?: number | string;
  expiresAt?: string;
  hasAnalytics?: boolean;
  viewCount?: number | null;
  advertiserBadge?: string;
}

export interface AdvertisementDetails extends Advertisement {
  advertiserId: string;
  description: string;
  phoneNumber: string;
  publisherType: string | number;
  advertiserName?: string;
  advertiserAvatarUrl?: string;
  viewCount: number;
  numberOfBedrooms?: number;
  numberOfBathrooms: number;
  numberOfFloors?: number;
  floorNumber?: number;
  latitude?: number;
  longitude?: number;
  images: string[];
}

export interface AdvertiserRatingSummary {
  average: number;
  count: number;
  distribution: Record<string, number>;
  myRating: number | null;
  canRate: boolean;
}

export interface AdvertiserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  joinedAt: string;
  rating: number;
  ratingCount: number;
  advertisementsCount: number;
  advertisements: Advertisement[];
  memberBadge?: string;
}

export interface AdvertisingPlan {
  type: number;
  price: number;
  advertisementCount: number;
  durationDays: number;
  promotionLevel: number;
  includesAnalytics: boolean;
  includesMemberBadge: boolean;
}

export interface AdvertisingPurchase {
  id: number;
  reference: string;
  planType: number;
  status: number;
  remainingAdvertisements: number;
  totalAdvertisements: number;
  expiresAt: string;
  promotionLevel: number;
  includesAnalytics: boolean;
}

export interface AdvertisingAccount {
  freeAdvertisementsRemaining: number;
  isUnlimitedPublishing: boolean;
  isPremiumMember: boolean;
  memberBadge?: string;
  activePurchases: AdvertisingPurchase[];
}

export interface AdvertisingCheckout {
  reference: string;
  checkoutUrl: string;
}

export interface AdvertisingPaymentResult {
  reference: string;
  status: number | string;
  planType: number | string;
}

export interface Developer {
  id: number; name: string; description?: string; logoUrl?: string;
  createdAt: string; projectsCount: number;
}

export interface Unit {
  id: number; title?: string; description?: string; activityType: string; type: string; status: string; price: number;
  downPayment?: number; installmentYears?: number; monthlyInstallment?: number;
  area: number; numberOfBedrooms?: number; numberOfBathrooms?: number; floorNumber?: number;
  latitude?: number; longitude?: number; numberOfFloors?: number; createdAt: string;
  projectId: number; projectName: string; images: string[];
}

export interface Favorite extends Omit<Advertisement, 'id' | 'status'> {
  favoriteId: number;
  advertisementId: number;
}

export interface LocationOption {
  id: number;
  name: string;
}

export interface ApiMessage { message: string; }

export type GlobalSearchItemType = 'Advertisement' | 'Project' | 'Unit';

export interface GlobalSearchItem {
  id: number;
  projectId?: number | null;
  type: GlobalSearchItemType;
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  price?: number | null;
  area?: number | null;
  createdAt: string;
}

export interface GlobalSearchResponse {
  query: string;
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: GlobalSearchItem[];
}
