import QRCode from 'qrcode'

const DARK_FILL = '#4c66ac' // --color-petal-deep
const MARGIN = 1
const FINDER_SIZE = 7 // finder-pattern squares are always 7x7 modules
// data-module corner radius: rounded enough to read as a dot, not so much
// it eats into the dark area and weakens contrast for phone scanners
const DATA_RADIUS = 0.25

function isFinderModule(row: number, col: number, size: number): boolean {
  const topEdge = row < FINDER_SIZE
  const bottomEdge = row >= size - FINDER_SIZE
  const leftEdge = col < FINDER_SIZE
  const rightEdge = col >= size - FINDER_SIZE
  return (topEdge && leftEdge) || (topEdge && rightEdge) || (bottomEdge && leftEdge)
}

/**
 * Party RSVP URL as an inline SVG QR code — crisp at any print scale.
 * Error correction level M balances density against reliable phone scans;
 * the token URL stays short enough (~70 chars) to stay scannable at ~30mm.
 *
 * Renders directly from the raw module matrix (bypassing the `qrcode`
 * library's own SVG renderer) so each module can be styled individually:
 * transparent background, petal-deep fill, rounded data modules — the
 * three finder-pattern squares stay sharp-cornered for scan reliability.
 */
export async function qrSvg(text: string): Promise<string> {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' })
  const { size, data } = modules
  const dimension = size + MARGIN * 2

  let finderRects = ''
  let dataRects = ''
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!data[row * size + col]) continue
      const rect = `<rect x="${col + MARGIN}" y="${row + MARGIN}" width="1" height="1"/>`
      if (isFinderModule(row, col, size)) finderRects += rect
      else dataRects += rect.replace('/>', ` rx="${DATA_RADIUS}"/>`)
    }
  }

  return '<svg xmlns="http://www.w3.org/2000/svg" '
    + `viewBox="0 0 ${dimension} ${dimension}" fill="${DARK_FILL}">`
    + `<g data-qr-finder>${finderRects}</g>`
    + `<g data-qr-data>${dataRects}</g>`
    + '</svg>\n'
}
