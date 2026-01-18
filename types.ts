
export enum FoodCategory {
  FRUITS_VEGGIES = 'FRUITS_VEGGIES',
  DAIRY = 'DAIRY',
  MEAT_FISH = 'MEAT_FISH',
  PANTRY = 'PANTRY',
  BEVERAGES = 'BEVERAGES',
  FROZEN = 'FROZEN',
  OTHER = 'OTHER'
}

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  purchaseDate: string;
  expiryDate: string;
  quantity: string;
  currentQuantity: number;
  isUsed: boolean;
}

export interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile' | string;
  imageUrl?: string;
}

export interface User {
  name: string;
  email: string;
}

export type Language = 'fr' | 'en' | 'ar';
export type AppView = 'dashboard' | 'fridge' | 'scan' | 'recipes' | 'settings';
