import React from 'react';
import {
  ShoppingCart,
  Utensils,
  Home,
  Zap,
  Phone,
  Car,
  Bus,
  HeartPulse,
  ShoppingBag,
  Tv,
  Gamepad2,
  Banknote,
  PiggyBank,
  GraduationCap,
  Plane,
  Dumbbell,
  Gift,
  Baby,
  Dog,
  Scissors,
  Wrench,
  Receipt,
  Landmark,
  Cigarette,
  MapPin,
  Sparkles,
  Coffee,
  Fuel,
  Film,
  Music,
  Briefcase,
  HelpCircle,
  Tag
} from 'lucide-react';

export interface CategoryIconOption {
  id: string;
  label: string;
  group: 'Quotidiano' | 'Casa & Utenze' | 'Trasporti' | 'Svago' | 'Lavoro & Finanza' | 'Altro';
}

export interface CategoryColorOption {
  id: string;
  label: string;
  textColor: string;
  bgLight: string;
  borderColor: string;
  gradient: string;
  preview: string;
}

export const CATEGORY_COLOR_OPTIONS: CategoryColorOption[] = [
  { id: 'purple', label: 'Viola', textColor: 'text-purple-400', bgLight: 'bg-purple-500/15', borderColor: 'border-purple-500/30', gradient: 'from-purple-600 to-pink-600', preview: 'bg-purple-500' },
  { id: 'indigo', label: 'Indaco', textColor: 'text-indigo-400', bgLight: 'bg-indigo-500/15', borderColor: 'border-indigo-500/30', gradient: 'from-indigo-600 to-blue-600', preview: 'bg-indigo-500' },
  { id: 'blue', label: 'Blu', textColor: 'text-blue-400', bgLight: 'bg-blue-500/15', borderColor: 'border-blue-500/30', gradient: 'from-blue-600 to-cyan-600', preview: 'bg-blue-500' },
  { id: 'cyan', label: 'Ciano', textColor: 'text-cyan-400', bgLight: 'bg-cyan-500/15', borderColor: 'border-cyan-500/30', gradient: 'from-cyan-600 to-teal-600', preview: 'bg-cyan-500' },
  { id: 'emerald', label: 'Smeraldo / Verde', textColor: 'text-emerald-400', bgLight: 'bg-emerald-500/15', borderColor: 'border-emerald-500/30', gradient: 'from-emerald-600 to-teal-600', preview: 'bg-emerald-500' },
  { id: 'amber', label: 'Ambra / Giallo', textColor: 'text-amber-400', bgLight: 'bg-amber-500/15', borderColor: 'border-amber-500/30', gradient: 'from-amber-500 to-yellow-600', preview: 'bg-amber-500' },
  { id: 'orange', label: 'Arancione', textColor: 'text-orange-400', bgLight: 'bg-orange-500/15', borderColor: 'border-orange-500/30', gradient: 'from-orange-500 to-red-600', preview: 'bg-orange-500' },
  { id: 'rose', label: 'Rosa / Rosso', textColor: 'text-rose-400', bgLight: 'bg-rose-500/15', borderColor: 'border-rose-500/30', gradient: 'from-rose-600 to-pink-600', preview: 'bg-rose-500' },
  { id: 'fuchsia', label: 'Fucsia', textColor: 'text-fuchsia-400', bgLight: 'bg-fuchsia-500/15', borderColor: 'border-fuchsia-500/30', gradient: 'from-fuchsia-600 to-purple-600', preview: 'bg-fuchsia-500' },
  { id: 'lime', label: 'Lime', textColor: 'text-lime-400', bgLight: 'bg-lime-500/15', borderColor: 'border-lime-500/30', gradient: 'from-lime-600 to-emerald-600', preview: 'bg-lime-500' },
  { id: 'teal', label: 'Teal', textColor: 'text-teal-400', bgLight: 'bg-teal-500/15', borderColor: 'border-teal-500/30', gradient: 'from-teal-600 to-cyan-700', preview: 'bg-teal-500' },
  { id: 'slate', label: 'Grigio', textColor: 'text-slate-400', bgLight: 'bg-slate-500/15', borderColor: 'border-slate-500/30', gradient: 'from-slate-600 to-slate-800', preview: 'bg-slate-500' },
];

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  // Quotidiano
  { id: 'shopping-cart', label: 'Alimentari & Supermercato', group: 'Quotidiano' },
  { id: 'utensils', label: 'Ristoranti & Pizzerie', group: 'Quotidiano' },
  { id: 'coffee', label: 'Bar & Colazioni', group: 'Quotidiano' },
  { id: 'shopping-bag', label: 'Shopping & Negozi', group: 'Quotidiano' },
  { id: 'scissors', label: 'Cura Personale / Barbiere', group: 'Quotidiano' },
  { id: 'heart-pulse', label: 'Salute & Farmacia', group: 'Quotidiano' },
  { id: 'cigarette', label: 'Sali & Tabacchi', group: 'Quotidiano' },

  // Casa & Utenze
  { id: 'home', label: 'Casa / Affitto / Mutuo', group: 'Casa & Utenze' },
  { id: 'zap', label: 'Bollette / Luce & Gas', group: 'Casa & Utenze' },
  { id: 'phone', label: 'Ricarica Telefono / Internet', group: 'Casa & Utenze' },
  { id: 'wrench', label: 'Riparazioni & Fai da te', group: 'Casa & Utenze' },
  { id: 'map-pin', label: 'Indirizzo Specifico / Condominio', group: 'Casa & Utenze' },

  // Trasporti
  { id: 'car', label: 'Auto & Manutenzione', group: 'Trasporti' },
  { id: 'fuel', label: 'Carburante / Benzina', group: 'Trasporti' },
  { id: 'bus', label: 'Mezzi Pubblici & Treni', group: 'Trasporti' },
  { id: 'plane', label: 'Viaggi & Vacanze', group: 'Trasporti' },

  // Svago & Famiglia
  { id: 'tv', label: 'Streaming & Abbonamenti', group: 'Svago' },
  { id: 'film', label: 'Cinema & Teatro', group: 'Svago' },
  { id: 'gamepad-2', label: 'Videogiochi & Gaming', group: 'Svago' },
  { id: 'music', label: 'Musica & Concerti', group: 'Svago' },
  { id: 'dumbbell', label: 'Sport & Palestra', group: 'Svago' },
  { id: 'gift', label: 'Regali & Feste', group: 'Svago' },
  { id: 'graduation-cap', label: 'Istruzione & Corsi', group: 'Svago' },
  { id: 'dog', label: 'Animali Domestici', group: 'Svago' },
  { id: 'baby', label: 'Famiglia & Infanzia', group: 'Svago' },

  // Lavoro & Finanza
  { id: 'banknote', label: 'Stipendio / Entrate', group: 'Lavoro & Finanza' },
  { id: 'briefcase', label: 'Lavoro / Fatture', group: 'Lavoro & Finanza' },
  { id: 'piggy-bank', label: 'Risparmi & Investimenti', group: 'Lavoro & Finanza' },
  { id: 'landmark', label: 'Canone & Commissioni', group: 'Lavoro & Finanza' },
  { id: 'receipt', label: 'Tasse / Imposta di Bollo', group: 'Lavoro & Finanza' },
  { id: 'sparkles', label: 'Altro / Varie', group: 'Altro' },
];

/**
 * Associa in modo intelligente una categoria al suo id icona predefinito
 */
export function getCategoryDefaultIcon(categoryName: string): string {
  const normalized = (categoryName || '').toLowerCase().trim();

  if (normalized.includes('stipendio') || normalized.includes('reddito') || normalized.includes('entrata')) {
    return 'banknote';
  }
  if (normalized.includes('alimentar') || normalized.includes('spesa') || normalized.includes('supermercato')) {
    return 'shopping-cart';
  }
  if (normalized.includes('ristorant') || normalized.includes('pizz') || normalized.includes('cena') || normalized.includes('pranzo')) {
    return 'utensils';
  }
  if (normalized.includes('bar') || normalized.includes('caff') || normalized.includes('colazion')) {
    return 'coffee';
  }
  if (normalized.includes('casa') || normalized.includes('affitto') || normalized.includes('mutuo')) {
    return 'home';
  }
  if (normalized.includes('bollett') || normalized.includes('luce') || normalized.includes('gas') || normalized.includes('utenze')) {
    return 'zap';
  }
  if (normalized.includes('telef') || normalized.includes('ricarica') || normalized.includes('internet') || normalized.includes('fibra')) {
    return 'phone';
  }
  if (normalized.includes('carburant') || normalized.includes('benzin') || normalized.includes('gasolio')) {
    return 'fuel';
  }
  if (normalized.includes('trasport') || normalized.includes('auto') || normalized.includes('veicol')) {
    return 'car';
  }
  if (normalized.includes('treno') || normalized.includes('bus') || normalized.includes('metro') || normalized.includes('mezzi')) {
    return 'bus';
  }
  if (normalized.includes('salute') || normalized.includes('farmac') || normalized.includes('medic') || normalized.includes('cura')) {
    return 'heart-pulse';
  }
  if (normalized.includes('shopping') || normalized.includes('vestiti') || normalized.includes('abbigliamento') || normalized.includes('scarpe')) {
    return 'shopping-bag';
  }
  if (normalized.includes('abbonament') || normalized.includes('streaming') || normalized.includes('netflix') || normalized.includes('spotify')) {
    return 'tv';
  }
  if (normalized.includes('gioch') || normalized.includes('game') || normalized.includes('gaming')) {
    return 'gamepad-2';
  }
  if (normalized.includes('musica') || normalized.includes('concerto')) {
    return 'music';
  }
  if (normalized.includes('sport') || normalized.includes('palestr') || normalized.includes('fitness')) {
    return 'dumbbell';
  }
  if (normalized.includes('viagg') || normalized.includes('vacanz') || normalized.includes('volo') || normalized.includes('hotel')) {
    return 'plane';
  }
  if (normalized.includes('istruzion') || normalized.includes('scuola') || normalized.includes('univers') || normalized.includes('corso') || normalized.includes('libr')) {
    return 'graduation-cap';
  }
  if (normalized.includes('regal') || normalized.includes('fest')) {
    return 'gift';
  }
  if (normalized.includes('animal') || normalized.includes('cane') || normalized.includes('gatto') || normalized.includes('pet')) {
    return 'dog';
  }
  if (normalized.includes('bambin') || normalized.includes('figl') || normalized.includes('neonat') || normalized.includes('infanz')) {
    return 'baby';
  }
  if (normalized.includes('barbier') || normalized.includes('parrucch') || normalized.includes('estet')) {
    return 'scissors';
  }
  if (normalized.includes('lavor') || normalized.includes('fattur') || normalized.includes('profession')) {
    return 'briefcase';
  }
  if (normalized.includes('risparm') || normalized.includes('investiment') || normalized.includes('pac') || normalized.includes('fondo')) {
    return 'piggy-bank';
  }
  if (normalized.includes('canon') || normalized.includes('commission')) {
    return 'landmark';
  }
  if (normalized.includes('bollo') || normalized.includes('impost') || normalized.includes('tass') || normalized.includes('f24')) {
    return 'receipt';
  }
  if (normalized.includes('tabacch') || normalized.includes('sali')) {
    return 'cigarette';
  }
  if (normalized.includes('viale') || normalized.includes('via') || normalized.includes('corso') || normalized.includes('piazza')) {
    return 'map-pin';
  }

  return 'sparkles';
}

/**
 * Associa in modo intelligente una categoria al suo colore predefinito
 */
export function getCategoryDefaultColor(categoryName: string): string {
  const normalized = (categoryName || '').toLowerCase().trim();

  if (normalized.includes('stipendio') || normalized.includes('reddito') || normalized.includes('entrata') || normalized.includes('risparm')) {
    return 'emerald';
  }
  if (normalized.includes('alimentar') || normalized.includes('spesa') || normalized.includes('supermercato')) {
    return 'amber';
  }
  if (normalized.includes('casa') || normalized.includes('affitto') || normalized.includes('mutuo')) {
    return 'indigo';
  }
  if (normalized.includes('trasport') || normalized.includes('auto') || normalized.includes('carburant') || normalized.includes('benzin')) {
    return 'blue';
  }
  if (normalized.includes('salute') || normalized.includes('farmac') || normalized.includes('medic') || normalized.includes('cura')) {
    return 'rose';
  }
  if (normalized.includes('bollett') || normalized.includes('luce') || normalized.includes('gas') || normalized.includes('telef')) {
    return 'cyan';
  }
  if (normalized.includes('ristorant') || normalized.includes('svago') || normalized.includes('pizz')) {
    return 'fuchsia';
  }
  if (normalized.includes('shopping') || normalized.includes('vestiti') || normalized.includes('abbigliamento')) {
    return 'purple';
  }
  if (normalized.includes('tabacch') || normalized.includes('sali')) {
    return 'orange';
  }
  if (normalized.includes('sport') || normalized.includes('palestr') || normalized.includes('fitness')) {
    return 'lime';
  }
  if (normalized.includes('viagg') || normalized.includes('vacanz')) {
    return 'teal';
  }
  if (normalized.includes('canon') || normalized.includes('bollo') || normalized.includes('tass') || normalized.includes('commission')) {
    return 'slate';
  }

  return 'purple';
}

/**
 * Recupera la mappa personalizzata di icone salvate in LocalStorage
 */
export function getSavedCategoryIcons(): Record<string, string> {
  try {
    const raw = localStorage.getItem('myfinance_category_icons_v3');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Recupera la mappa personalizzata dei colori salvati in LocalStorage
 */
export function getSavedCategoryColors(): Record<string, string> {
  try {
    const raw = localStorage.getItem('myfinance_category_colors_v3');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Salva l'icona per una specifica categoria
 */
export function saveCategoryIcon(categoryName: string, iconId: string): void {
  try {
    const current = getSavedCategoryIcons();
    current[categoryName] = iconId;
    localStorage.setItem('myfinance_category_icons_v3', JSON.stringify(current));
  } catch (err) {
    console.error('Error saving category icon:', err);
  }
}

/**
 * Salva il colore per una specifica categoria
 */
export function saveCategoryColor(categoryName: string, colorId: string): void {
  try {
    const current = getSavedCategoryColors();
    current[categoryName] = colorId;
    localStorage.setItem('myfinance_category_colors_v3', JSON.stringify(current));
  } catch (err) {
    console.error('Error saving category color:', err);
  }
}

/**
 * Elimina icona e colore salvati se la categoria viene eliminata
 */
export function deleteCategoryIconAndColor(categoryName: string): void {
  try {
    const icons = getSavedCategoryIcons();
    delete icons[categoryName];
    localStorage.setItem('myfinance_category_icons_v3', JSON.stringify(icons));

    const colors = getSavedCategoryColors();
    delete colors[categoryName];
    localStorage.setItem('myfinance_category_colors_v3', JSON.stringify(colors));
  } catch (err) {
    console.error('Error deleting category icon and color:', err);
  }
}

export const deleteCategoryIcon = deleteCategoryIconAndColor;

/**
 * Restituisce i dettagli di stile del colore di una categoria
 */
export function getCategoryColorDetails(colorIdOrCategoryName?: string): CategoryColorOption {
  if (!colorIdOrCategoryName) {
    return CATEGORY_COLOR_OPTIONS[0]; // purple
  }

  // Se è un ID colore valido, restituiscilo
  const directMatch = CATEGORY_COLOR_OPTIONS.find((c) => c.id === colorIdOrCategoryName);
  if (directMatch) return directMatch;

  // Altrimenti trattalo come nome di categoria
  const savedColors = getSavedCategoryColors();
  const savedColorId = savedColors[colorIdOrCategoryName];
  if (savedColorId) {
    const match = CATEGORY_COLOR_OPTIONS.find((c) => c.id === savedColorId);
    if (match) return match;
  }

  // Fallback sul colore predefinito della categoria
  const defId = getCategoryDefaultColor(colorIdOrCategoryName);
  return CATEGORY_COLOR_OPTIONS.find((c) => c.id === defId) || CATEGORY_COLOR_OPTIONS[0];
}

interface CategoryIconProps {
  iconName?: string;
  categoryName?: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName,
  categoryName,
  className = 'w-4 h-4',
}) => {
  let effectiveId = iconName;

  if (!effectiveId && categoryName) {
    const saved = getSavedCategoryIcons();
    effectiveId = saved[categoryName] || getCategoryDefaultIcon(categoryName);
  }

  switch (effectiveId) {
    case 'shopping-cart':
      return <ShoppingCart className={className} />;
    case 'utensils':
      return <Utensils className={className} />;
    case 'coffee':
      return <Coffee className={className} />;
    case 'shopping-bag':
      return <ShoppingBag className={className} />;
    case 'home':
      return <Home className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'phone':
      return <Phone className={className} />;
    case 'car':
      return <Car className={className} />;
    case 'fuel':
      return <Fuel className={className} />;
    case 'bus':
      return <Bus className={className} />;
    case 'plane':
      return <Plane className={className} />;
    case 'heart-pulse':
      return <HeartPulse className={className} />;
    case 'tv':
      return <Tv className={className} />;
    case 'film':
      return <Film className={className} />;
    case 'gamepad-2':
      return <Gamepad2 className={className} />;
    case 'music':
      return <Music className={className} />;
    case 'dumbbell':
      return <Dumbbell className={className} />;
    case 'gift':
      return <Gift className={className} />;
    case 'baby':
      return <Baby className={className} />;
    case 'dog':
      return <Dog className={className} />;
    case 'scissors':
      return <Scissors className={className} />;
    case 'wrench':
      return <Wrench className={className} />;
    case 'graduation-cap':
      return <GraduationCap className={className} />;
    case 'banknote':
      return <Banknote className={className} />;
    case 'briefcase':
      return <Briefcase className={className} />;
    case 'piggy-bank':
      return <PiggyBank className={className} />;
    case 'landmark':
      return <Landmark className={className} />;
    case 'receipt':
      return <Receipt className={className} />;
    case 'cigarette':
      return <Cigarette className={className} />;
    case 'map-pin':
      return <MapPin className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    default:
      return <Tag className={className} />;
  }
};

/**
 * Badge completo con icona e colore coordinati per la categoria
 */
interface CategoryBadgeProps {
  categoryName: string;
  iconName?: string;
  colorId?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  categoryName,
  iconName,
  colorId,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const colorDetails = getCategoryColorDetails(colorId || categoryName);
  const sizeClasses = {
    sm: 'p-1 rounded-lg text-xs',
    md: 'p-1.5 rounded-xl text-xs',
    lg: 'p-2.5 rounded-2xl text-sm',
  };
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${colorDetails.bgLight} ${colorDetails.textColor} border ${colorDetails.borderColor} ${sizeClasses[size]} ${className}`}
    >
      <CategoryIcon
        categoryName={categoryName}
        iconName={iconName}
        className={iconSizes[size]}
      />
      {showLabel && <span className="font-semibold truncate">{categoryName}</span>}
    </div>
  );
};
