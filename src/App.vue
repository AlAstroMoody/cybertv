<script setup lang="ts">
import TvPlayer from './components/TvPlayer.vue'
</script>

<template>
  <TvPlayer />
</template>

<style>
@font-face {
  font-family: 'Cyberpunk';
  src: url('/cybertv/fonts/Cyberpunk.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
}

@font-face {
  font-family: 'OpenSans';
  src: url('/cybertv/fonts/OpenSans-Regular.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #0e0e17 url('/cybertv/images/bg.webp') center/cover no-repeat fixed;
  overflow: hidden;
  font-family: 'OpenSans', sans-serif;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: url('/cybertv/images/boot/ambient-glow.svg') left top / 100% 100% no-repeat;
  pointer-events: none;
  z-index: 0;
}
</style>
