import { Path } from '@nestjs/config';
import { Package } from '../entities/package.entity';

export const packagesData: Partial<Package>[] = [
  {
    name: 'Basic',
    price: 0,
    maxStorage: 5,
    detail: '5GB Storage',
  },
  {
    name: 'Standard',
    price: 100,
    detail: '10GB Storage extra',
    maxStorage: 10,
  },
  {
    name: 'Premium',
    price: 200,
    maxStorage: 20,
    detail: '20GB Storage extra',
  },
];
