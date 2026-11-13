export function formatMoney(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${Math.abs(Math.round(amount)).toLocaleString('en-US')}`;
}

export function signedMoney(amount: number): string {
  return `${amount >= 0 ? '+' : '-'}$${Math.abs(Math.round(amount)).toLocaleString('en-US')}`;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
