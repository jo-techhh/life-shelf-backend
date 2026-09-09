export interface DefaultMediaDefinition {
  name: string;
  type: string;
  provider: string;
  publicId: string;
  url: string;
  secureUrl: string;
  metadata: {
    category: string;
    width: number;
    height: number;
    format: string;
    isDefault: boolean;
  };
}

export const DEFAULT_MEDIA_ASSETS: DefaultMediaDefinition[] = [
  {
    name: 'Movie Default Cover',
    type: 'image/jpeg',
    provider: 'SYSTEM_DEFAULT',
    publicId: 'default_assets/movie_default',
    url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop',
    secureUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop',
    metadata: {
      category: 'movie',
      width: 1000,
      height: 1500,
      format: 'jpg',
      isDefault: true,
    },
  },
  {
    name: 'Series Default Cover',
    type: 'image/jpeg',
    provider: 'SYSTEM_DEFAULT',
    publicId: 'default_assets/series_default',
    url: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=1000&auto=format&fit=crop',
    secureUrl: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=1000&auto=format&fit=crop',
    metadata: {
      category: 'series',
      width: 1000,
      height: 1500,
      format: 'jpg',
      isDefault: true,
    },
  },
  {
    name: 'Book Default Cover',
    type: 'image/jpeg',
    provider: 'SYSTEM_DEFAULT',
    publicId: 'default_assets/book_default',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop',
    secureUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=1000&auto=format&fit=crop',
    metadata: {
      category: 'reading',
      width: 1000,
      height: 1500,
      format: 'jpg',
      isDefault: true,
    },
  },
  {
    name: 'Study Default Cover',
    type: 'image/jpeg',
    provider: 'SYSTEM_DEFAULT',
    publicId: 'default_assets/study_default',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop',
    secureUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop',
    metadata: {
      category: 'study',
      width: 1000,
      height: 1500,
      format: 'jpg',
      isDefault: true,
    },
  },
  {
    name: 'Travel Default Cover',
    type: 'image/jpeg',
    provider: 'SYSTEM_DEFAULT',
    publicId: 'default_assets/travel_default',
    url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000&auto=format&fit=crop',
    secureUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000&auto=format&fit=crop',
    metadata: {
      category: 'travel',
      width: 1000,
      height: 1500,
      format: 'jpg',
      isDefault: true,
    },
  },
  {
    name: 'Generic Default Cover',
    type: 'image/jpeg',
    provider: 'SYSTEM_DEFAULT',
    publicId: 'default_assets/generic_default',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
    secureUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
    metadata: {
      category: 'generic',
      width: 1000,
      height: 1500,
      format: 'jpg',
      isDefault: true,
    },
  },
];
