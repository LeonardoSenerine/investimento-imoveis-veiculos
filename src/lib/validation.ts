/** Validação e máscaras dos campos de cadastro. */

export const onlyDigits = (value: string) => value.replace(/\D/g, '');

/** Formata enquanto digita: (11) 91234-5678 / (11) 3123-4567 */
export function maskPhoneBR(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  const split = d.length === 11 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

export function validateName(value: string): string | null {
  const name = value.trim().replace(/\s+/g, ' ');
  if (!name) return 'Informe seu nome.';
  if (name.length < 2) return 'Informe um nome válido.';
  if (name.length > 80) return 'Use até 80 caracteres.';
  if (!/^[\p{L}][\p{L}' .-]*$/u.test(name)) return 'Use apenas letras no nome.';
  return null;
}

export function validatePhoneBR(value: string): string | null {
  const d = onlyDigits(value);
  if (!d) return 'Informe seu WhatsApp com DDD.';
  if (d.length < 10) return 'Número incompleto. Inclua o DDD.';
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return 'DDD inválido.';
  if (d.length === 11 && d[2] !== '9') return 'Celulares começam com 9 após o DDD.';
  if (/^(\d)\1+$/.test(d.slice(2))) return 'Verifique o número informado.';
  return null;
}

/** Retorna o telefone no formato E.164 sem "+": 5511912345678 */
export const toE164BR = (value: string) => `55${onlyDigits(value)}`;
