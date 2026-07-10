/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BusStop {
  id: string; // Internal identifier, e.g. "stop-1", "stop-6"
  numberLabel: string; // The bus stop number/label (e.g., "1", "6", "12", "16", "22", "26", "35", "39/55", "44/50", "60", "66")
  name: string; // Name of the bus stop
  description: string; // Short description
  trivia: string; // Interesting local trivia or tourist sightseeing information
  landmark: string; // Primary landmark/icon category (e.g., "station", "school", "shop", "hospital", "office")
  themeColor: string; // Tailwind color class for borders/backgrounds (e.g., "blue", "green", "orange")
  latOffset: number; // For plotting on a visual route map
  lngOffset: number; // For plotting on a visual route map
}

export interface CollectedStamp {
  stopId: string;
  collectedAt: string; // ISO date string
  method: 'camera' | 'simulation';
}

export type TabType = 'stamps' | 'map' | 'scan' | 'prizes' | 'admin';

export async function generateSecureToken(stopId: string): Promise<string> {
  // Pure JS deterministic hash algorithm (combines FNV-1a and DJB2) to guarantee 
  // 100% consistent tokens regardless of HTTPS/HTTP, secure contexts, or mobile WebView engines.
  const secretSalt = 'ryu_bus_secure_salt_2026_X928_v2';
  const combined = stopId + secretSalt;
  
  let fnv = 2166136261;
  let djb = 5381;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    fnv ^= char;
    fnv = Math.imul(fnv, 16777619);
    djb = ((djb << 5) + djb) ^ char;
  }
  
  const fnvHex = (fnv >>> 0).toString(16).padStart(8, '0');
  const djbHex = (djb >>> 0).toString(16).padStart(8, '0');
  return (fnvHex + djbHex).substring(0, 16);
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  try {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    const secureHash = '12bd6946f697893df89780422472b00b6fec83c13ca5003393a254c1ce54e50f';
    return hashHex === secureHash;
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

// Cryptographically secure stamp persistence signature generator
export async function generateSecureSignature(data: string): Promise<string> {
  try {
    const integritySalt = 'ryu_stamp_rally_cryptographic_integrity_v1_99x';
    const msgBuffer = new TextEncoder().encode(data + integritySalt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Fallback simple checksum if subtle crypto fails
    let hash = 5381;
    const combined = data + 'fallback_integrity_key';
    for (let i = 0; i < combined.length; i++) {
      hash = (hash * 33) ^ combined.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  }
}

export async function serializeStamps(stamps: CollectedStamp[]): Promise<string> {
  const plainString = JSON.stringify(stamps);
  const signature = await generateSecureSignature(plainString);
  const envelope = {
    stamps,
    signature
  };
  const plainEnvelope = JSON.stringify(envelope);
  return 'RYU_SECURE_V2_' + btoa(unescape(encodeURIComponent(plainEnvelope)));
}

export async function deserializeStamps(obfuscated: string): Promise<CollectedStamp[]> {
  try {
    if (obfuscated.startsWith('RYU_SECURE_V2_')) {
      const base64Part = obfuscated.substring('RYU_SECURE_V2_'.length);
      const decodedString = decodeURIComponent(escape(atob(base64Part)));
      const envelope = JSON.parse(decodedString);
      if (envelope && Array.isArray(envelope.stamps) && typeof envelope.signature === 'string') {
        const recalculated = await generateSecureSignature(JSON.stringify(envelope.stamps));
        if (recalculated === envelope.signature) {
          return envelope.stamps;
        } else {
          console.error('Security alert: Local storage stamp data signature mismatch (tampering detected)!');
          return [];
        }
      }
    } else if (obfuscated.startsWith('RYU_SECURE_')) {
      // Legacy format automatic secure migration
      const base64Part = obfuscated.substring('RYU_SECURE_'.length);
      const decodedString = decodeURIComponent(escape(atob(base64Part)));
      const stamps = JSON.parse(decodedString);
      return Array.isArray(stamps) ? stamps : [];
    }
    const parsed = JSON.parse(obfuscated);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to deserialize stamps securely:', e);
    return [];
  }
}


