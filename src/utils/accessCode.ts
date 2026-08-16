/** ДДММ локальной даты + 2 дня. Сам код в репу не кладём. */
export function getAccessCode(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}${mm}`
}

export function isAccessCode(input: string, now = new Date()): boolean {
  return input.length === 4 && input === getAccessCode(now)
}
