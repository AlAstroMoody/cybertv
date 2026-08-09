# Code Review — mytv

Обзор проекта от 2026-08-09. Проблемы отсортированы по приоритету.

---

## Критично (функциональность)

### 1. HLS (.m3u8) в браузере

Большинство IPTV-потоков — `.m3u8`. Safari умеет их нативно, Chrome/Firefox — нет. Сейчас используется голый `<video>` без `hls.js` (или аналога). Многие каналы просто не запустятся.

**Файлы:** `src/composables/usePlayer.ts`, `src/components/TvPlayer.vue`

**Решение:** подключить `hls.js`, определять формат URL и для `.m3u8` использовать `Hls.attachMedia()`.

---

### 2. CORS на потоках

Даже с HLS браузер не воспроизведёт URL, если сервер не отдаёт CORS-заголовки. Часть каналов из публичного плейлиста может быть недоступна без прокси или бэкенда.

**Решение:** документировать ограничение; при необходимости — прокси-слой или список «рабочих» источников.

---

### 3. `play()` без обработки ошибок

```ts
function play() {
  video.value?.play()
  isPlaying.value = true
}
```

`play()` возвращает Promise и часто падает (autoplay policy, битый поток). `isPlaying` ставится в `true` оптимистично, canvas считает что идёт эфир, хотя видео молчит. Нет слушателей `play` / `pause` / `error` на `<video>`.

**Файл:** `src/composables/usePlayer.ts`

**Решение:** `await video.play()` в try/catch, синхронизировать `isPlaying` через события видео.

---

## Важно (UX и корректность)

### 4. `isLoading` / `hasError` не отображаются

Состояние передаётся в `RendererState`, но `canvasRenderer` его игнорирует. Иконки `errorIcon`, `performanceIcon`, `chaosIcon` загружаются, но не рисуются. Пользователь не видит ни загрузку, ни ошибку плейлиста.

**Файлы:** `src/renderer/canvasRenderer.ts`, `src/components/TvPlayer.vue`

---

### 5. Карты таро перетасовываются при каждом `render()`

```ts
const shuffled = [...this.tarotCards].sort(() => Math.random() - 0.5)
```

При каждом нажатии стрелки карты меняются — визуальный шум.

**Файл:** `src/renderer/canvasRenderer.ts`

**Решение:** выбрать карты один раз при старте или при смене канала.

---

### 6. Атрибут `loop` на `<video>`

Для live IPTV `loop` — странный выбор: при обрыве потока видео может зациклить последний сегмент вместо показа ошибки.

**Файл:** `src/components/TvPlayer.vue`

---

### 7. `loadM3U` не проверяет `response.ok`

```ts
const response = await fetch(url)
const text = await response.text()
```

404/500 всё равно парсятся как M3U → пустой или мусорный список без `hasError`.

**Файл:** `src/composables/useChannelList.ts`

**Решение:** проверять `response.ok`, выставлять `hasError = true` при неуспехе.

---

### 8. Парсинг имён с запятыми в M3U

`parts[parts.length - 1]` ломает названия вроде `"CNN, HD"`.

**Файл:** `src/composables/useChannelList.ts`

**Решение:** парсить `tvg-name="..."` или всё после последней запятой по спецификации M3U.

---

## Архитектура / мёртвый код

### 9. Роутер подключён, но не используется

`main.ts` подключает `vue-router`, в `App.vue` — прямой `<TvPlayer />`, без `<RouterView />`. Роутер сейчас лишний.

**Файлы:** `src/main.ts`, `src/App.vue`, `src/router/index.ts`

**Решение:** убрать router или перейти на `<RouterView />`.

---

### 10. Заготовки без реализации

| Что | Где | Статус |
|-----|-----|--------|
| `visibleChannels` | `useChannelList.ts` | возвращает весь список, не используется |
| `categories` | `useChannelList.ts` | собираются, UI нет |
| `showMenu`, `currentView`, `toggleMenu` | `useNavigation.ts` | не задействованы |
| `performanceIcon`, `chaosIcon`, `errorIcon` | `canvasRenderer.ts` | загружаются, не рисуются |

---

### 11. Производительность списка каналов

```ts
state.channels.forEach((channel, i) => {
  if (i < startIndex || i >= endIndex) return
  // ...
})
```

При тысячах каналов каждый `render()` обходит весь массив.

**Файл:** `src/renderer/canvasRenderer.ts`

**Решение:** цикл `for (let i = startIndex; i < endIndex; i++)`.

---

## Что сделано хорошо

- Разделение на composables + canvas renderer — понятная структура
- Фильтрация мусорных URL в M3U
- PWA с кешированием плейлиста и ассетов
- Canvas overlay с `pointer-events: none`
- Реактивная перерисовка через `watch` без лишних дублей (после рефакторинга)

---

## Рекомендуемый порядок правок

| # | Задача | Эффект |
|---|--------|--------|
| 1 | `hls.js` + определение формата URL | каналы реально играют |
| 2 | События `video` + `await play()` | синхронизация `isPlaying` |
| 3 | UI loading/error на canvas | обратная связь пользователю |
| 4 | `response.ok` в `loadM3U` | корректная обработка ошибок |
| 5 | Убрать router или `<RouterView />` | меньше путаницы |
| 6 | Фиксированные таро-карты | стабильный UI |
| 7 | Цикл только по видимым каналам | производительность на больших плейлистах |
