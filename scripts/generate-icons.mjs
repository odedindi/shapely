#!/usr/bin/env node
/**
 * Generates all required PWA PNG icons from the SVG source.
 * Run once after cloning or when the icon design changes.
 *
 * Usage: node scripts/generate-icons.mjs
 * Requires: npm install --save-dev sharp
 */

import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const iconsDir = resolve(root, 'public/icons')
const splashDir = resolve(root, 'public/splash')

mkdirSync(iconsDir, { recursive: true })
mkdirSync(splashDir, { recursive: true })

const iconSvg = readFileSync(resolve(iconsDir, 'icon.svg'))
const maskableSvg = readFileSync(resolve(iconsDir, 'icon-maskable.svg'))

const BG_COLOR = { r: 99, g: 102, b: 241, alpha: 1 }

const icons = [
  { size: 16,   src: iconSvg,      out: 'favicon-16.png' },
  { size: 32,   src: iconSvg,      out: 'favicon-32.png' },
  { size: 48,   src: iconSvg,      out: 'icon-48.png' },
  { size: 72,   src: iconSvg,      out: 'icon-72.png' },
  { size: 96,   src: iconSvg,      out: 'icon-96.png' },
  { size: 128,  src: iconSvg,      out: 'icon-128.png' },
  { size: 144,  src: iconSvg,      out: 'icon-144.png' },
  { size: 152,  src: iconSvg,      out: 'icon-152.png' },
  { size: 180,  src: iconSvg,      out: 'icon-180.png' },
  { size: 192,  src: iconSvg,      out: 'icon-192.png' },
  { size: 256,  src: iconSvg,      out: 'icon-256.png' },
  { size: 384,  src: iconSvg,      out: 'icon-384.png' },
  { size: 512,  src: iconSvg,      out: 'icon-512.png' },
  { size: 512,  src: maskableSvg,  out: 'icon-maskable-512.png' },
]

const splashScreens = [
  { w: 2048, h: 2732, out: 'splash-ipad-pro-12.9.png' },
  { w: 1668, h: 2388, out: 'splash-ipad-pro-11.png' },
  { w: 1290, h: 2796, out: 'splash-iphone-14-pro-max.png' },
  { w: 1179, h: 2556, out: 'splash-iphone-14-pro.png' },
  { w: 1170, h: 2532, out: 'splash-iphone-14.png' },
  { w: 1080, h: 1920, out: 'splash-android-fhd.png' },
]

async function generateIcons() {
  console.log('Generating PWA icons…')
  for (const icon of icons) {
    await sharp(icon.src)
      .resize(icon.size, icon.size)
      .png()
      .toFile(resolve(iconsDir, icon.out))
    console.log(`  ✓ ${icon.out}`)
  }
}

async function generateSplashScreens() {
  console.log('Generating splash screens…')
  const logoSize = 256
  const logoBuffer = await sharp(iconSvg).resize(logoSize, logoSize).png().toBuffer()

  for (const splash of splashScreens) {
    const canvas = sharp({
      create: {
        width: splash.w,
        height: splash.h,
        channels: 4,
        background: BG_COLOR,
      },
    })

    const x = Math.round((splash.w - logoSize) / 2)
    const y = Math.round((splash.h - logoSize) / 2)

    await canvas
      .composite([{ input: logoBuffer, left: x, top: y }])
      .png()
      .toFile(resolve(splashDir, splash.out))
    console.log(`  ✓ ${splash.out}`)
  }
}

async function main() {
  await generateIcons()
  await generateSplashScreens()
  console.log('\nAll icons generated. Update index.html splash links if needed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
