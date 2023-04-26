import { Package } from '../entities/package.entity';

export const packagesData: Partial<Package>[] = [
  {
    name: 'Basic',
    price: 0,
    detail: '5GB Storage',
    maxStorage: 5,
  },
  {
    name: 'Standard',
    price: 10,
    detail: '20GB Storage extra',
    maxStorage: 20,
  },
  {
    name: 'Premium',
    price: 30,
    detail: '50GB Storage extra',
    maxStorage: 50,
  },
];
