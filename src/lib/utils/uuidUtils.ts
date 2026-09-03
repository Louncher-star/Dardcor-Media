const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id: unknown): id is string {
  return typeof id === 'string' && UUID_REGEX.test(id);
}

export function toValidUuid(id?: string | null | undefined): string {
  if (!id) {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');
  }

  const str = String(id).trim();
  if (UUID_REGEX.test(str)) {
    return str;
  }

  // Konversi string non-UUID (seperti usr_1788408940816_j7nbt) secara deterministik ke valid UUID v4
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = (hash1 << 5) - hash1 + char;
    hash1 |= 0;
    hash2 = (hash2 << 7) - hash2 + char;
    hash2 |= 0;
  }

  const h1 = Math.abs(hash1).toString(16).padStart(8, '0').slice(0, 8);
  const h2 = Math.abs(hash2).toString(16).padStart(12, '0').slice(0, 12);

  return `00000000-0000-4000-8000-${(h1 + h2).slice(0, 12)}`;
}
