/** Растр SVG крупнее intrinsic — canvas drawImage тогда не апскейлит в кашу на HiDPI */
function scaleSvgMarkup(svg: string, scale: number): string {
  if (scale <= 1) return svg

  return svg.replace(/<svg\b([^>]*)>/i, (_match, attrs: string) => {
    let next = attrs

    const widthMatch = attrs.match(/\bwidth="([\d.]+)(px)?"/i)
    const heightMatch = attrs.match(/\bheight="([\d.]+)(px)?"/i)

    if (widthMatch?.[1]) {
      const w = Number(widthMatch[1]) * scale
      next = next.replace(/\bwidth="[\d.]+(px)?"/i, `width="${w}"`)
    }
    if (heightMatch?.[1]) {
      const h = Number(heightMatch[1]) * scale
      next = next.replace(/\bheight="[\d.]+(px)?"/i, `height="${h}"`)
    }

    return `<svg${next}>`
  })
}

export async function loadImage(src: string): Promise<HTMLImageElement> {
  const isSvg = /\.svg(\?|#|$)/i.test(src)
  if (!isSvg) {
    const img = new Image()
    img.src = src
    await img.decode()
    return img
  }

  const scale = Math.max(2, Math.round(window.devicePixelRatio || 1))
  const res = await fetch(src)
  if (!res.ok) throw new Error(`Failed to load image: ${src}`)
  const markup = scaleSvgMarkup(await res.text(), scale)
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }))

  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function loadImages(srcs: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(srcs.map((src) => loadImage(src)))
}

export async function loadFonts(
  families: string[],
  size = '16px',
): Promise<void> {
  await Promise.all(families.map((family) => document.fonts.load(`${size} '${family}'`)))

  const pending = families.filter((family) => !document.fonts.check(`${size} '${family}'`))
  if (pending.length === 0) return

  await document.fonts.ready

  for (const family of pending) {
    while (!document.fonts.check(`${size} '${family}'`)) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }
}
