const MAX_UINT32 = 0x1_0000_0000;
const STICK_COUNT = 100;
const ACCEPTABLE_LIMIT = MAX_UINT32 - (MAX_UINT32 % STICK_COUNT);

export interface RandomValuesProvider { getRandomValues<T extends ArrayBufferView | null>(array: T): T; }

export function drawGuanyinStickNumber(random: RandomValuesProvider = crypto): number {
  const bytes = new Uint32Array(1);
  do { random.getRandomValues(bytes); } while (bytes[0] >= ACCEPTABLE_LIMIT);
  return (bytes[0] % STICK_COUNT) + 1;
}
