import { ethers } from 'ethers';

export function normalizeHex(hex: string) {
  if (!hex) return '0x';
  const s = String(hex);

  const indices = [];
  const re = /0x/gi;
  let m;
  while ((m = re.exec(s)) !== null) {
    indices.push(m.index);
  }

  let best = '';
  if (indices.length === 0) {
    best = s.replace(/[^0-9a-fA-F]/g, '');
  } else {
    for (let i = 0; i < indices.length; i++) {
      const start = indices[i] + 2;
      const end = i + 1 < indices.length ? indices[i + 1] : s.length;
      const candidate = s.slice(start, end).replace(/[^0-9a-fA-F]/g, '');
      if (candidate.length > best.length) best = candidate;
    }
  }

  if (!best) return '0x';
  if (best.length % 2) throw new Error('hex length must be even');
  return '0x' + best.toLowerCase();
}

export function toBytes32(addrOrBytes32: string) {
  const h = normalizeHex(addrOrBytes32);
  if (h.length === 42) return ethers.zeroPadValue(h, 32);
  if (h.length === 66) return h;
  throw new Error('expected address(20B) or bytes32(32B)');
}

export function encodeUint(value: string, sizeBytes: number) {
  const bn = BigInt(value);
  const max = (1n << BigInt(sizeBytes * 8)) - 1n;

  if (bn < 0n || bn > max) {
    throw new Error(`value does not fit uint${sizeBytes * 8}`);
  }

  return ethers.zeroPadValue(ethers.toBeHex(bn), sizeBytes);
}

export function buildEndpointV2LzComposePayload(params: {
  nonce: string;
  srcEid: string;
  amountLD: string;
  composeFrom: string;
  composeMsg: string;
}) {
  const { nonce, srcEid, amountLD, composeFrom, composeMsg } = params;
  return ethers.concat([
    encodeUint(nonce, 8),
    encodeUint(srcEid, 4),
    encodeUint(amountLD, 32),
    toBytes32(composeFrom),
    normalizeHex(composeMsg),
  ]);
}

export const NATIVE_MSG_FEE_BUFFER: bigint = 105n;
