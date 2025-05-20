<script setup>

defineProps({
  title: {
    type: String,
    default: ''
  },
  subTitle: {
    type: String,
    default: ''
  }
})

</script>


<template>
  <div class="home-panel">
    <div class="container">
      <div class="head">
        <!-- 主标题和副标题 -->
        <h3>
          {{ title }}<small>{{subTitle}}</small>
        </h3>
      </div>
      <!-- 主体内容区域 -->
<!--      <div> 主体内容 </div>-->
      <slot/>
    </div>
  </div>
</template>