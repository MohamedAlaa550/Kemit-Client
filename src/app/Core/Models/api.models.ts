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
  subscriptionType?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  startingPrice: number;
  maxPrice?: number;
  status: string;
  deliveryDate?: string;
  developerId: number;
  developerName: string;
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

export interface Advertisement {
  id: number;
  title: string;
  description?: string;
  phoneNumber?: string;
  price: number;
  cityName: string;
  governorateName: string;
  propertyType: string | number;
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
  createdAt: string;
  isFeatured: boolean;
}

export interface AdvertisementDetails extends Advertisement {
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

export interface Developer {
  id: number; name: string; description?: string; logoUrl?: string; websiteUrl?: string;
  phone?: string; email?: string; createdAt: string; projectsCount: number;
}

export interface Unit {
  id: number; title?: string; description?: string; type: string; status: string; price: number;
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
