export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD.MM.YYYY' | 'MM.DD.YYYY';

export function formatDate(date: Date | string, format: DateFormat = 'DD/MM/YYYY'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD.MM.YYYY':
      return `${day}.${month}.${year}`;
    case 'MM.DD.YYYY':
      return `${month}.${day}.${year}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const monthName = monthNames[d.getMonth()];
  
  return `${day} ${monthName}`;
}

export function getDateFormatFromPreferences(preferences: Record<string, unknown> | null): DateFormat {
  if (!preferences || !preferences.dateFormat) {
    return 'DD/MM/YYYY';
  }
  return preferences.dateFormat as DateFormat;
}

