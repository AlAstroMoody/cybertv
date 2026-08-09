export const COLORS = {
  // Основные цвета
  primary: '#F75049', // Текст неактивных пунктов
  activeText: '#5EF6FF', // Текст активного элемента
  secondary: '#D6D0D0', // Вторичный
  accent: '#1DED83', // Акцентный зеленый
  blue: '#2570D4', // Синий
  purple: '#9D2BF5', // Фиолетовый
  orange: '#FB932E', // Оранжевый
  yellow: '#F0B537', // Желтый

  // Фоны
  background: '#0E0E17', // Основной фон
  listBackground: 'rgba(0, 0, 0, 0.7)', // Фон списка

  // Текст
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.3)',

  // Эффекты
  shadow: '#00ccff',
} as const

export type ColorKey = keyof typeof COLORS
