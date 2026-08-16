/** Пути из `public/` с учётом `base` (на GH Pages это `/cybertv/`). */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}
