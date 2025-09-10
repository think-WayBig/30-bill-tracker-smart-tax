// utils/cpin.ts
// Extracts a 14-digit CPIN from narration strings like:
// "CBDT/BANK REFERENCE NO:K2509732840988/CIN NO:25040700904775HDFC/ONLINE"

export function extractCpinFromNarration(narration: string | undefined | null): string | null {
  if (!narration) return null

  // Remove stray bidi/zero-width characters that often sneak in from PDFs/Excels
  const clean = narration.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')

  // Preferred: look for "CIN NO:" or "CPIN:" followed by 14 digits (letters may follow, e.g., HDFC)
  const m1 = clean.match(/\b(CIN|CPIN)\s*NO[:\s-]*[A-Z]?(\d{14})(?!\d)/i)
  if (m1) return m1[2]

  // Fallback: first standalone 14-digit number (not followed by another digit)
  const m2 = clean.match(/(\d{14})(?!\d)/)
  return m2 ? m2[1] : null
}
