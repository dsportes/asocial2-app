<template>
  <div>{{  foo }}</div>
</template>

<srcipt setup lang="ts">
  import { ref } from 'vue'
  const foo = ref('hello')
</srcipt>

