import { createHash } from 'node:crypto';
import type { Random } from './deck.ts';

const UINT32_RANGE = 2 ** 32;

export function seededRandom(seed: string): Random {
  let counter = 0;
  let block = Buffer.alloc(0);
  let offset = 0;

  const nextUint32 = () => {
    if (offset === block.length) {
      const prefix = Buffer.alloc(4);
      prefix.writeUInt32BE(counter++);
      block = createHash('sha256').update(prefix).update(seed).digest();
      offset = 0;
    }
    const value = block.readUInt32BE(offset);
    offset += 4;
    return value;
  };

  return (maxExclusive) => {
    // Rejection sampling: a plain modulo would favour low indices.
    const limit = UINT32_RANGE - (UINT32_RANGE % maxExclusive);
    let value = nextUint32();
    while (value >= limit) {
      value = nextUint32();
    }
    return value % maxExclusive;
  };
}
