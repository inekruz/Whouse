import SHA256 from 'crypto-js/sha256';

export function sendSecureRequest(userId) {
  const timestamp = Date.now();
  const raw = `${userId}:${process.env.REACT_APP_KEY}`;
  const token = SHA256(raw).toString();

  const tokenWithTimestamp = `${timestamp}-${token}`;
  return tokenWithTimestamp;
}