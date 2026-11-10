/**
 * Browser-only randomness for the private account generator.
 * Uses crypto.getRandomValues with rejection sampling (no modulo bias).
 */

export function randomIndex(length: number): number {
  if (length <= 0) {
    throw new Error("length must be positive");
  }

  const max = 0x1_0000_0000;
  const limit = max - (max % length);
  const buf = new Uint32Array(1);
  let value = 0;

  do {
    crypto.getRandomValues(buf);
    value = buf[0] ?? 0;
  } while (value >= limit);

  return value % length;
}

export function pickOne<T>(items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty list");
  }
  return items[randomIndex(items.length)] as T;
}

export function pickChar(alphabet: string): string {
  if (alphabet.length === 0) {
    throw new Error("Alphabet must not be empty");
  }
  return alphabet.charAt(randomIndex(alphabet.length));
}

export function shuffle<T>(items: readonly T[]): T[] {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    const current = next[i] as T;
    next[i] = next[j] as T;
    next[j] = current;
  }
  return next;
}
