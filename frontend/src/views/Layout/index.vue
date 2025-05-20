<script setup>
import LayoutFixed from '@/views/Layout/components/LayoutFixed.vue'   // 路径 / 名字要对
import LayoutNav from "@/views/Layout/components/LayoutNav.vue";
import LayoutHeader from "@/views/Layout/components/LayoutHeader.vue";
import LayoutFooter from "@/views/Layout/components/LayoutFooter.vue";
</script>

<template>
  <LayoutFixed></LayoutFixed>
  <LayoutNav></LayoutNav>
  <LayoutHeader></LayoutHeader>
  <RouterView/>
  <LayoutFooter></LayoutFooter>
</template>

<style scoped>

</style>