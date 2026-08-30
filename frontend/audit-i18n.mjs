/**
 * i18n audit: flattens en/ta locale trees, scans all source for t('...') usage,
 * and reports (1) keys used but missing, (2) keys missing in ta, (3) ta values
 * identical to English (likely untranslated).
 */
import { build } from 'esbuild'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

async function bundleLocale(file) {
  const res = await build({
    entryPoints: [file],
    bundle: true,
    format: 'cjs',
    write: false,
    platform: 'node',
    logLevel: 'silent',
  })
  const out = res.outputFiles[0].text
  const mod = { exports: {} }
  new Function('module', 'exports', out)(mod, mod.exports)
  const exp = mod.exports
  // Handles: export default {...} | export const en = {...} | mixed
  if (exp.default && typeof exp.default === 'object' && Object.keys(exp.default).length) return exp.default
  for (const v of Object.values(exp)) {
    if (v && typeof v === 'object' && Object.keys(v).length) return v
  }
  throw new Error(`No locale object found in ${file}; exports=${Object.keys(exp).join(',')}`)
}

function flatten(obj, prefix = '', acc = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object') flatten(v, key, acc)
    else acc[key] = String(v)
  }
  return acc
}

const en = flatten(await bundleLocale('src/i18n/locales/en.ts'))
const ta = flatten(await bundleLocale('src/i18n/locales/ta.ts'))

function walk(dir, acc = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    const s = statSync(p)
    if (s.isDirectory()) {
      if (!/node_modules|dist/.test(p)) walk(p, acc)
    } else if (/\.(tsx?|ts)$/.test(f) && !/i18n[\\/]locales|audit-i18n/.test(p)) acc.push(p)
  }
  return acc
}

const used = new Map()
for (const file of walk('src')) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(/\bt\(\s*'([^']+)'/g)) {
    if (!used.has(m[1])) used.set(m[1], [])
    used.get(m[1]).push(file.replace(/\\/g, '/').replace(/^src\//, ''))
  }
}

const missingEn = [...used.keys()].filter((k) => !(k in en))
const missingTa = [...used.keys()].filter((k) => k in en && !(k in ta))
const untranslated = Object.keys(en).filter((k) => k in ta && en[k] === ta[k] && /[a-zA-Z]{3,}/.test(en[k]))

console.log(`\n== i18n audit ==`)
console.log(`keys used in code: ${used.size} | en: ${Object.keys(en).length} | ta: ${Object.keys(ta).length}`)
console.log(`\n-- USED BUT MISSING IN en.ts (${missingEn.length}) --`)
missingEn.forEach((k) => console.log(`  ${k}  <- ${[...new Set(used.get(k))].join(', ')}`))
console.log(`\n-- IN en BUT MISSING IN ta.ts (used in code) (${missingTa.length}) --`)
missingTa.forEach((k) => console.log(`  ${k}`))
console.log(`\n-- ta VALUE IDENTICAL TO en (possible untranslated) (${untranslated.length}) --`)
untranslated.slice(0, 40).forEach((k) => console.log(`  ${k} = "${en[k]}"`))

writeFileSync('audit-i18n-report.json', JSON.stringify({ missingEn, missingTa, untranslated }, null, 2))
console.log('\nreport -> audit-i18n-report.json')
