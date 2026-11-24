import React from 'react';
import {
  Landmark,
  PiggyBank,
  CreditCard,
  Building2,
  Wallet,
  Coins,
  BadgeDollarSign,
  Banknote,
  Smartphone,
  TrendingUp,
  ShieldCheck,
  Gem,
  Briefcase,
  Globe,
  Receipt,
  CircleDollarSign,
  Euro,
  Percent,
  Lock,
  Scale,
  HandCoins,
  QrCode,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

export interface AccountIconOption {
  id: string;
  label: string;
  category: 'Banca' | 'Carte' | 'Digitale' | 'Risparmio' | 'Altro';
}

export const ACCOUNT_ICON_OPTIONS: AccountIconOption[] = [
  { id: 'landmark', label: 'Banca Tradizionale', category: 'Banca' },
  { id: 'building-2', label: 'Filiale / Istituto', category: 'Banca' },
  { id: 'credit-card', label: 'Carta di Credito / Debito', category: 'Carte' },
  { id: 'wallet', label: 'Portafoglio / Contanti', category: 'Banca' },
  { id: 'banknote', label: 'Banconote / Liquidità', category: 'Banca' },
  { id: 'coins', label: 'Monete / Spiccioli', category: 'Banca' },
  { id: 'piggy-bank', label: 'Salvadanaio / Risparmi', category: 'Risparmio' },
  { id: 'smartphone', label: 'Conto Online / Neobank', category: 'Digitale' },
  { id: 'qr-code', label: 'Smart Pay / Satispay', category: 'Digitale' },
  { id: 'trending-up', label: 'Investimenti / Trading', category: 'Risparmio' },
  { id: 'percent', label: 'Conto Deposito Interessi', category: 'Risparmio' },
  { id: 'shield-check', label: 'Fondo Emergenza', category: 'Risparmio' },
  { id: 'briefcase', label: 'Conto Business / P.IVA', category: 'Banca' },
  { id: 'globe', label: 'Conto Estero / Valute', category: 'Banca' },
  { id: 'euro', label: 'Euro Riserva', category: 'Banca' },
  { id: 'circle-dollar-sign', label: 'Dollaro / Valuta', category: 'Banca' },
  { id: 'gem', label: 'Beni di Valore / Oro', category: 'Altro' },
  { id: 'receipt', label: 'Conto Fiscale / Tasse', category: 'Altro' },
  { id: 'lock', label: 'Cassetta di Sicurezza', category: 'Altro' },
  { id: 'hand-coins', label: 'Prestiti / Anticipi', category: 'Altro' },
  { id: 'shopping-bag', label: 'Spese Quotidiane', category: 'Carte' },
  { id: 'scale', label: 'Patrimonio Netto', category: 'Altro' },
  { id: 'sparkles', label: 'Conto Speciale', category: 'Altro' },
];

interface AccountIconProps {
  iconName: string;
  className?: string;
}

export const AccountIcon: React.FC<AccountIconProps> = ({ iconName, className = 'w-4 h-4' }) => {
  switch (iconName) {
    case 'landmark':
      return <Landmark className={className} />;
    case 'piggy-bank':
      return <PiggyBank className={className} />;
    case 'credit-card':
      return <CreditCard className={className} />;
    case 'building-2':
      return <Building2 className={className} />;
    case 'wallet':
      return <Wallet className={className} />;
    case 'coins':
      return <Coins className={className} />;
    case 'banknote':
      return <Banknote className={className} />;
    case 'smartphone':
      return <Smartphone className={className} />;
    case 'trending-up':
      return <TrendingUp className={className} />;
    case 'shield-check':
      return <ShieldCheck className={className} />;
    case 'gem':
      return <Gem className={className} />;
    case 'briefcase':
      return <Briefcase className={className} />;
    case 'globe':
      return <Globe className={className} />;
    case 'receipt':
      return <Receipt className={className} />;
    case 'circle-dollar-sign':
      return <CircleDollarSign className={className} />;
    case 'euro':
      return <Euro className={className} />;
    case 'percent':
      return <Percent className={className} />;
    case 'lock':
      return <Lock className={className} />;
    case 'scale':
      return <Scale className={className} />;
    case 'hand-coins':
      return <HandCoins className={className} />;
    case 'qr-code':
      return <QrCode className={className} />;
    case 'shopping-bag':
      return <ShoppingBag className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    default:
      return <BadgeDollarSign className={className} />;
  }
};
