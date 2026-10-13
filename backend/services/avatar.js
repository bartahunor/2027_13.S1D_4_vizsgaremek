import sharp from 'sharp'
import { fileTypeFromBuffer } from 'file-type'

const BEMENETI_TIPUSOK = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BAJT = 512 * 1024
const MAX_BEMENETI_PIXEL = 25_000_000   // védelem a "decompression bomb" ellen
const MERETEK = [512, 384, 256]         // ha kell, kisebbre veszünk
const MINOSEGEK = [85, 75, 65, 55, 45, 35]

export class KepHiba extends Error {}

async function kodol(buffer, formatum, meret, minoseg) {
  const kep = sharp(buffer, { limitInputPixels: MAX_BEMENETI_PIXEL })
    .rotate()                                           // EXIF szerinti forgatás
    .resize(meret, meret, { fit: 'cover' })

  return formatum === 'jpeg'
    ? kep.jpeg({ quality: minoseg, mozjpeg: true }).toBuffer()
    : kep.webp({ quality: minoseg }).toBuffer()
}

export async function feldolgozKep(buffer) {
  // 1) A valódi tartalom alapján döntünk, nem a kiterjesztés/Content-Type alapján
  const tipus = await fileTypeFromBuffer(buffer)
  if (!tipus || !BEMENETI_TIPUSOK.includes(tipus.mime)) {
    throw new KepHiba('Csak JPEG, PNG, WebP vagy GIF kép tölthető fel')
  }

  // 2) JPEG marad JPEG, a WebP marad WebP, minden más WebP-re alakul
  const formatum = tipus.mime === 'image/jpeg' ? 'jpeg' : 'webp'
  const mime = formatum === 'jpeg' ? 'image/jpeg' : 'image/webp'

  // 3) Újrakódolás + tömörítés 512 KB alá
  try {
    for (const meret of MERETEK) {
      for (const minoseg of MINOSEGEK) {
        const kimenet = await kodol(buffer, formatum, meret, minoseg)
        if (kimenet.length <= MAX_BAJT) {
          return { buffer: kimenet, mime }
        }
      }
    }
  } catch {
    throw new KepHiba('A kép sérült vagy nem feldolgozható')
  }

  throw new KepHiba('A kép nem tömöríthető 512 KB alá')
}