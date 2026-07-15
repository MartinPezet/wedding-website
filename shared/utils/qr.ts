import QRCode from 'qrcode'

/**
 * Party RSVP URL as an inline SVG QR code — crisp at any print scale.
 * Error correction level M balances density against reliable phone scans;
 * the token URL stays short enough (~70 chars) to stay scannable at ~30mm.
 */
export function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'M', margin: 1 })
}
