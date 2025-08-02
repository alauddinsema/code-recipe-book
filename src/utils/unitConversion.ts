export type UnitSystem = 'metric' | 'imperial';
export type WeightUnit = 'kg' | 'lb';

export interface UserPreferences {
  unitSystem: UnitSystem;
  weightUnit: WeightUnit;
  autoConvertSmallWeights: boolean;
}

export interface ConvertedUnit {
  amount: number;
  unit: string;
  originalAmount: number;
  originalUnit: string;
}

// Unit conversion mappings
export const UNIT_CONVERSIONS = {
  // Volume conversions (to ml)
  'tsp': 4.92892,
  'teaspoon': 4.92892,
  'teaspoons': 4.92892,
  'tbsp': 14.7868,
  'tablespoon': 14.7868,
  'tablespoons': 14.7868,
  'cup': 236.588,
  'cups': 236.588,
  'fl oz': 29.5735,
  'fluid ounce': 29.5735,
  'fluid ounces': 29.5735,
  'pint': 473.176,
  'pints': 473.176,
  'quart': 946.353,
  'quarts': 946.353,
  'gallon': 3785.41,
  'gallons': 3785.41,
  'ml': 1,
  'milliliter': 1,
  'milliliters': 1,
  'l': 1000,
  'liter': 1000,
  'liters': 1000,
  
  // Weight conversions (to grams)
  'oz': 28.3495,
  'ounce': 28.3495,
  'ounces': 28.3495,
  'lb': 453.592,
  'pound': 453.592,
  'pounds': 453.592,
  'g': 1,
  'gram': 1,
  'grams': 1,
  'kg': 1000,
  'kilogram': 1000,
  'kilograms': 1000
};

// Weight units that can be auto-converted
const WEIGHT_UNITS = ['kg', 'kilogram', 'kilograms', 'g', 'gram', 'grams', 'lb', 'pound', 'pounds', 'oz', 'ounce', 'ounces'];

/**
 * Get user preferences from localStorage
 */
export const getUserPreferences = (userId?: string): UserPreferences => {
  const defaultPreferences: UserPreferences = {
    unitSystem: 'metric',
    weightUnit: 'kg',
    autoConvertSmallWeights: true
  };

  if (!userId) return defaultPreferences;

  try {
    const saved = localStorage.getItem(`user_preferences_${userId}`);
    if (saved) {
      return { ...defaultPreferences, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Failed to load user preferences:', error);
  }

  return defaultPreferences;
};

/**
 * Smart unit conversion based on user preferences
 */
export const convertUnit = (
  amount: number, 
  unit: string, 
  preferences: UserPreferences
): ConvertedUnit => {
  const normalizedUnit = unit.toLowerCase().trim();
  
  // If auto-convert small weights is enabled and this is a weight unit
  if (preferences.autoConvertSmallWeights && WEIGHT_UNITS.includes(normalizedUnit)) {
    return convertSmallWeights(amount, normalizedUnit, preferences);
  }

  // Convert based on unit system preference
  if (preferences.unitSystem === 'imperial' && isMetricUnit(normalizedUnit)) {
    return convertToImperial(amount, normalizedUnit);
  } else if (preferences.unitSystem === 'metric' && isImperialUnit(normalizedUnit)) {
    return convertToMetric(amount, normalizedUnit);
  }

  // No conversion needed
  return {
    amount,
    unit,
    originalAmount: amount,
    originalUnit: unit
  };
};

/**
 * Convert small weights (< 1 kg to grams, < 1 lb to oz)
 */
const convertSmallWeights = (
  amount: number,
  unit: string,
  _preferences: UserPreferences
): ConvertedUnit => {
  const originalAmount = amount;
  const originalUnit = unit;

  // Handle kg to g conversion
  if ((unit === 'kg' || unit === 'kilogram' || unit === 'kilograms') && amount < 1) {
    return {
      amount: Math.round(amount * 1000),
      unit: amount === 1 ? 'g' : 'g',
      originalAmount,
      originalUnit
    };
  }

  // Handle lb to oz conversion
  if ((unit === 'lb' || unit === 'pound' || unit === 'pounds') && amount < 1) {
    return {
      amount: Math.round(amount * 16 * 100) / 100, // Round to 2 decimal places
      unit: amount === 1 ? 'oz' : 'oz',
      originalAmount,
      originalUnit
    };
  }

  // No conversion needed
  return {
    amount,
    unit,
    originalAmount,
    originalUnit
  };
};

/**
 * Check if unit is metric
 */
const isMetricUnit = (unit: string): boolean => {
  const metricUnits = ['kg', 'kilogram', 'kilograms', 'g', 'gram', 'grams', 'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters'];
  return metricUnits.includes(unit.toLowerCase());
};

/**
 * Check if unit is imperial
 */
const isImperialUnit = (unit: string): boolean => {
  const imperialUnits = ['lb', 'pound', 'pounds', 'oz', 'ounce', 'ounces', 'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon', 'teaspoons', 'fl oz', 'fluid ounce', 'fluid ounces', 'pint', 'pints', 'quart', 'quarts', 'gallon', 'gallons'];
  return imperialUnits.includes(unit.toLowerCase());
};

/**
 * Convert metric to imperial
 */
const convertToImperial = (amount: number, unit: string): ConvertedUnit => {
  const originalAmount = amount;
  const originalUnit = unit;

  switch (unit.toLowerCase()) {
    case 'kg':
    case 'kilogram':
    case 'kilograms':
      return {
        amount: Math.round(amount * 2.20462 * 100) / 100,
        unit: amount === 1 ? 'lb' : 'lb',
        originalAmount,
        originalUnit
      };
    case 'g':
    case 'gram':
    case 'grams':
      return {
        amount: Math.round(amount * 0.035274 * 100) / 100,
        unit: amount === 1 ? 'oz' : 'oz',
        originalAmount,
        originalUnit
      };
    case 'ml':
    case 'milliliter':
    case 'milliliters':
      return {
        amount: Math.round(amount * 0.033814 * 100) / 100,
        unit: amount === 1 ? 'fl oz' : 'fl oz',
        originalAmount,
        originalUnit
      };
    case 'l':
    case 'liter':
    case 'liters':
      return {
        amount: Math.round(amount * 4.22675 * 100) / 100,
        unit: amount === 1 ? 'cup' : 'cups',
        originalAmount,
        originalUnit
      };
    default:
      return { amount, unit, originalAmount, originalUnit };
  }
};

/**
 * Convert imperial to metric
 */
const convertToMetric = (amount: number, unit: string): ConvertedUnit => {
  const originalAmount = amount;
  const originalUnit = unit;

  switch (unit.toLowerCase()) {
    case 'lb':
    case 'pound':
    case 'pounds':
      return {
        amount: Math.round(amount * 0.453592 * 100) / 100,
        unit: amount === 1 ? 'kg' : 'kg',
        originalAmount,
        originalUnit
      };
    case 'oz':
    case 'ounce':
    case 'ounces':
      return {
        amount: Math.round(amount * 28.3495),
        unit: amount === 1 ? 'g' : 'g',
        originalAmount,
        originalUnit
      };
    case 'fl oz':
    case 'fluid ounce':
    case 'fluid ounces':
      return {
        amount: Math.round(amount * 29.5735),
        unit: amount === 1 ? 'ml' : 'ml',
        originalAmount,
        originalUnit
      };
    case 'cup':
    case 'cups':
      return {
        amount: Math.round(amount * 236.588),
        unit: amount === 1 ? 'ml' : 'ml',
        originalAmount,
        originalUnit
      };
    default:
      return { amount, unit, originalAmount, originalUnit };
  }
};

/**
 * Format amount with proper fraction display
 */
export const formatAmount = (amount: number): string => {
  // Convert decimals to fractions for common cooking measurements
  const fractions: { [key: number]: string } = {
    0.125: '1/8',
    0.25: '1/4',
    0.33: '1/3',
    0.375: '3/8',
    0.5: '1/2',
    0.625: '5/8',
    0.67: '2/3',
    0.75: '3/4',
    0.875: '7/8'
  };

  const whole = Math.floor(amount);
  const decimal = amount - whole;

  // Find closest fraction
  let closestFraction = '';
  let closestDiff = Infinity;
  
  for (const [dec, frac] of Object.entries(fractions)) {
    const diff = Math.abs(decimal - parseFloat(dec));
    if (diff < closestDiff && diff < 0.05) {
      closestDiff = diff;
      closestFraction = frac;
    }
  }

  if (closestFraction && whole > 0) {
    return `${whole} ${closestFraction}`;
  } else if (closestFraction) {
    return closestFraction;
  } else if (amount < 1) {
    return amount.toFixed(2);
  } else {
    return amount % 1 === 0 ? amount.toString() : amount.toFixed(1);
  }
};

/**
 * Format unit display with proper pluralization
 */
export const formatUnit = (amount: number, unit: string): string => {
  const normalizedUnit = unit.toLowerCase();
  
  // Handle pluralization
  if (amount === 1) {
    // Convert plural to singular
    switch (normalizedUnit) {
      case 'cups': return 'cup';
      case 'tablespoons': return 'tablespoon';
      case 'teaspoons': return 'teaspoon';
      case 'pounds': return 'pound';
      case 'ounces': return 'ounce';
      case 'grams': return 'gram';
      case 'kilograms': return 'kilogram';
      case 'liters': return 'liter';
      case 'milliliters': return 'milliliter';
      default: return unit;
    }
  } else {
    // Convert singular to plural
    switch (normalizedUnit) {
      case 'cup': return 'cups';
      case 'tablespoon': return 'tablespoons';
      case 'teaspoon': return 'teaspoons';
      case 'pound': return 'pounds';
      case 'ounce': return 'ounces';
      case 'gram': return 'grams';
      case 'kilogram': return 'kilograms';
      case 'liter': return 'liters';
      case 'milliliter': return 'milliliters';
      default: return unit;
    }
  }
};
