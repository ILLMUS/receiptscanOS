import { RECEIPT_CATEGORIES } from './categories';

// Keyword-to-category mapping covering everyday household spending as well as
// trade / business purchases. First match wins, so specific terms come first.
const KEYWORD_MAP: Record<string, string[]> = {
  groceries: [
    'grocer', 'supermarket', 'spar', 'shoprite', 'pick n pay', 'picknpay', 'checkers',
    'usave', 'boxer', 'woolworths', 'food lover', 'fruit', 'veg', 'butcher', 'bakery',
    'dairy', 'market', 'mini mart', 'tuck shop', 'ok foods',
  ],
  dining: [
    'restaurant', 'cafe', 'coffee', 'takeaway', 'take away', 'kfc', 'nandos', 'debonairs',
    'steers', 'pizza', 'burger', 'chicken licken', 'mugg', 'wimpy', 'bar ', 'pub',
    'catering', 'canteen', 'deli',
  ],
  household: [
    'household', 'furniture', 'home', 'decor', 'bedding', 'kitchen', 'appliance',
    'cleaning', 'detergent', 'laundry', 'game store', 'jumbo', 'lewis', 'ok furniture',
    'garden', 'nursery',
  ],
  utilities: [
    'electric', 'electricity', 'water', 'sewage', 'waste', 'municipal', 'council',
    'eswatini electricity', 'seb', 'ewsc', 'prepaid', 'rates', 'rent',
  ],
  transport: [
    'transport', 'delivery', 'freight', 'courier', 'shipping', 'truck', 'bus', 'kombi',
    'taxi', 'uber', 'toll', 'parking', 'airline', 'flight', 'ticket', 'car hire',
    'licence', 'license', 'tyre', 'tire',
  ],
  fuel_gas: [
    'fuel', 'diesel', 'petrol', 'gasoline', 'gas', 'lpg', 'propane', 'acetylene',
    'oxygen', 'nitrogen', 'shell', 'engen', 'caltex', 'total energies', 'bp',
    'sasol', 'galp', 'filling station',
  ],
  health: [
    'pharmacy', 'chemist', 'clinic', 'hospital', 'doctor', 'dentist', 'optic',
    'medical', 'health', 'lab', 'physio', 'medicine', 'dis-chem', 'clicks',
  ],
  personal: [
    'clothing', 'boutique', 'fashion', 'shoe', 'salon', 'barber', 'hair', 'beauty',
    'cosmetic', 'jewel', 'mr price', 'pep ', 'ackermans', 'truworths', 'edgars', 'sportscene',
  ],
  education: [
    'school', 'college', 'university', 'tuition', 'creche', 'daycare', 'nursery school',
    'books', 'bookshop', 'stationer', 'course', 'training', 'exam',
  ],
  entertainment: [
    'cinema', 'movie', 'netflix', 'spotify', 'dstv', 'showmax', 'gym', 'fitness',
    'game ', 'sport', 'lodge', 'hotel', 'travel', 'tour', 'event', 'ticketpro',
  ],
  raw_materials: [
    'steel', 'metal', 'iron', 'aluminium', 'aluminum', 'copper', 'brass', 'pipe', 'tube',
    'plate', 'sheet', 'bar', 'rod', 'beam', 'angle', 'channel', 'mesh',
    'hardware', 'bolt', 'nut', 'screw', 'rivet', 'washer', 'fastener', 'paint',
    'building', 'timber', 'cement', 'concrete', 'sand', 'aggregate', 'builders',
  ],
  tools_equipment: [
    'tool', 'drill', 'grinder', 'saw', 'clamp', 'vice', 'hammer', 'spanner',
    'wrench', 'plier', 'measure', 'tape', 'level', 'machine', 'compressor',
    'generator', 'jack', 'hoist', 'winch', 'makita', 'bosch', 'dewalt', 'hilti',
  ],
  welding_supplies: [
    'weld', 'electrode', 'flux', 'argon', 'co2', 'mig', 'tig', 'arc',
    'cutting disc', 'grinding disc', 'abrasive', 'solder', 'brazing',
    'afrox', 'airliquide', 'air liquide',
  ],
  ppe_safety: [
    'safety', 'ppe', 'helmet', 'glove', 'goggle', 'boot', 'overall', 'mask',
    'visor', 'earplug', 'harness', 'fire extinguisher', 'first aid', 'workwear',
  ],
  maintenance: [
    'maintenance', 'repair', 'service', 'spare', 'bearing', 'belt',
    'filter', 'oil', 'lubricant', 'grease', 'hydraulic', 'pneumatic', 'plumb',
    'electrician', 'panel beat', 'garage',
  ],
  subcontractor: [
    'subcontractor', 'contractor', 'labour', 'labor', 'manpower', 'hire',
    'rental', 'consulting', 'engineering', 'cleaner', 'security',
  ],
  office_admin: [
    'office', 'stationery', 'paper', 'ink', 'toner', 'printer', 'computer',
    'phone', 'airtime', 'data', 'internet', 'mtn', 'eswatini mobile', 'subscription',
    'insurance', 'accounting', 'legal', 'bank', 'swazibank', 'fnb', 'nedbank',
    'standard bank', 'post office', 'courier fee',
  ],
};

export function suggestCategory(storeName: string): string | null {
  if (!storeName || storeName.trim().length < 2) return null;
  const lower = storeName.toLowerCase();

  for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return category;
      }
    }
  }
  return null;
}
