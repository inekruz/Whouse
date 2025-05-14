import SHA256 from 'crypto-js/sha256';

export function sendSecureRequest(userId) {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).substring(2, 10);
  const raw = `${userId}:${process.env.REACT_APP_KEY}:${nonce}`;
  const token = SHA256(raw).toString();

  const tokenWithTimestamp = `${timestamp}-${token}-${nonce}`;
  return tokenWithTimestamp;
}
