import currencies from '../assets/data/currencies.json';
export const CURRENCY_OPTIONS = currencies;
export const DEFAULT_CURRENCY = 'BND';
export const isSupportedCurrency = (code: string) =>
  currencies.some(item => item.value === code);
export const currencyLabel = (code?: string) =>
  !code || code === 'BND' ? 'B$' : code;
export const formatMoney = (amount: number, code?: string) =>
  `${currencyLabel(code)} ${amount.toFixed(2)}`;
