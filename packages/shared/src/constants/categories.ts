export interface SeedCategory {
  name: string;
  slug: string;
  hindiName: string;
  imageUrl?: string;
  displayOrder: number;
}

export const FIXED_CATEGORIES: SeedCategory[] = [
  {
    name: "Grocery & Essentials",
    slug: "grocery-essentials",
    hindiName: "किराना और आवश्यक सामान",
    displayOrder: 1,
  },
  {
    name: "Rice/Flour & Pulses",
    slug: "rice-flour-pulses",
    hindiName: "चावल, आटा और दालें",
    displayOrder: 2,
  },
  {
    name: "Oil/Spices & Masalas",
    slug: "oil-spices-masalas",
    hindiName: "तेल और मसाले",
    displayOrder: 3,
  },
  {
    name: "Biscuits & Snacks",
    slug: "biscuits-snacks",
    hindiName: "बिस्कुट और नमकीन",
    displayOrder: 4,
  },
  {
    name: "Beverages & Cold Drinks",
    slug: "beverages-cold-drinks",
    hindiName: "चाय, कॉफी और कोल्ड ड्रिंक्स",
    displayOrder: 5,
  },
  {
    name: "Personal Care",
    slug: "personal-care",
    hindiName: "पर्सनल केयर और साबुन",
    displayOrder: 6,
  },
  {
    name: "Home & Cleaning Products",
    slug: "home-cleaning-products",
    hindiName: "घर और सफाई का सामान",
    displayOrder: 7,
  },
  {
    name: "Baby Products",
    slug: "baby-products",
    hindiName: "बच्चों के उत्पाद",
    displayOrder: 8,
  },
  {
    name: "Chocolates & Sweets",
    slug: "chocolates-sweets",
    hindiName: "चॉकलेट और मिठाइयां",
    displayOrder: 9,
  },
  {
    name: "Daily Essentials",
    slug: "daily-essentials",
    hindiName: "रोजमर्रा का जरूरी सामान",
    displayOrder: 10,
  },
];
