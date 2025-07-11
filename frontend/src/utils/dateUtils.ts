/**
 * Utilitários para formatação de datas
 * Resolve problemas de fuso horário com campos de data
 */

/**
 * Formata uma data para exibição no formato brasileiro (DD/MM/AAAA)
 * Evita problemas de fuso horário com campos de data simples
 */
export function formatDateBR(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return 'N/A';
  
  let date: Date;
  
  if (typeof dateValue === 'string') {
    // Se é uma string de data simples (YYYY-MM-DD), trata como UTC para evitar offset
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateValue.split('-').map(Number);
      date = new Date(year, month - 1, day); // Cria data local sem conversão de fuso
    } else {
      // Para timestamps completos, usa construtor normal
      date = new Date(dateValue);
    }
  } else {
    date = new Date(dateValue);
  }
  
  // Verifica se a data é válida
  if (isNaN(date.getTime())) {
    return 'Data inválida';
  }
  
  // Formata manualmente para garantir formato correto
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formata data e hora completa no formato brasileiro
 */
export function formatDateTimeBR(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return 'N/A';
  
  const date = new Date(dateValue);
  
  if (isNaN(date.getTime())) {
    return 'Data inválida';
  }
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Converte data brasileira (DD/MM/AAAA) para formato ISO (YYYY-MM-DD)
 */
export function convertBRDateToISO(brDate: string): string {
  if (!brDate) return '';
  
  const parts = brDate.split('/');
  if (parts.length !== 3) return '';
  
  const [day, month, year] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Converte data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/AAAA)
 */
export function convertISODateToBR(isoDate: string): string {
  if (!isoDate) return '';
  
  const parts = isoDate.split('-');
  if (parts.length !== 3) return '';
  
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

/**
 * Converte uma data (string ou Date) para Date sem problemas de fuso horário
 * Para campos de data simples (YYYY-MM-DD), mantém como data local
 */
export function parseDate(dateValue: string | Date | null | undefined): Date | null {
  if (!dateValue) return null;
  
  if (typeof dateValue === 'string') {
    // Se é uma string de data simples (YYYY-MM-DD), trata como UTC para evitar offset
    if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateValue.split('-').map(Number);
      return new Date(year, month - 1, day); // Cria data local sem conversão de fuso
    } else {
      // Para timestamps completos, usa construtor normal
      return new Date(dateValue);
    }
  } else {
    return new Date(dateValue);
  }
}

/**
 * Compara se uma data está dentro de um intervalo (inclusive)
 * Evita problemas de fuso horário
 */
export function isDateInRange(
  dateToCheck: string | Date | null | undefined,
  startDate: string | Date,
  endDate: string | Date
): boolean {
  const checkDate = parseDate(dateToCheck);
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  if (!checkDate || !start || !end) return false;
  
  // Compara apenas as datas (ignora horas)
  const checkDateOnly = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
  const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  
  return checkDateOnly >= startDateOnly && checkDateOnly <= endDateOnly;
}

/**
 * Verifica se uma data pertence a um mês/ano específico
 * Evita problemas de fuso horário
 */
export function isDateInMonth(
  dateToCheck: string | Date | null | undefined,
  month: string,
  year: string
): boolean {
  const checkDate = parseDate(dateToCheck);
  if (!checkDate) return false;
  
  const dateMonth = (checkDate.getMonth() + 1).toString().padStart(2, '0');
  const dateYear = checkDate.getFullYear().toString();
  
  return dateMonth === month && dateYear === year;
}