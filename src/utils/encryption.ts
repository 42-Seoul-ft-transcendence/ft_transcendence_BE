import CryptoJS from 'crypto-js';
import { ENCRYPTION_KEY } from '../global/config/index.js';

/**
 * 데이터를 암호화합니다.
 * @param data 암호화할 문자열
 * @returns 암호화된 문자열
 */
export function encrypt(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

/**
 * 암호화된 데이터를 복호화합니다.
 * @param encryptedData 암호화된 문자열
 * @returns 복호화된 문자열
 */
export function decrypt(encryptedData: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
