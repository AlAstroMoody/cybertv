import { ALL_CATEGORIES } from '../composables/useChannelList'

/** Ярлыки сетки для архива. Ключ — group-title из M3U, фильтр не меняется. */
export const DISTRICT_LABELS: Record<string, string> = {
  [ALL_CATEGORIES]: 'NIGHT CITY',
  Общие: 'WATSON',
  Новости: 'CITY CENTER',
  Спорт: 'SANTO DOMINGO',
  Кино: 'WESTBROOK',
  Музыка: 'JAPANTOWN',
  Развлечение: 'CHARTER HILL',
  Детям: 'HEYWOOD',
  Знания: 'NORTH OAK',
  Релакс: 'PACIFICA',
  Религия: 'COASTVIEW',
  Хобби: 'KABUKI',
}

export function districtLabel(groupId: string, realAccess: boolean): string {
  if (!realAccess) {
    return groupId === ALL_CATEGORIES ? 'Все каналы' : groupId
  }
  return DISTRICT_LABELS[groupId] ?? groupId
}
