<script setup>
import { ref, watch } from 'vue'
import { useMouseInElement } from '@vueuse/core'

// 接收单个图片 URL 作为 prop
const props = defineProps({
  imageUrl: {
    type: String,
    required: true // 现在 imageUrl 是必须的
  }
})

// 移除 activeIndex 和 enterHandler，因为不再需要切换图片
// const activeIndex = ref(0)
// const enterHandler = (i) => {
//   activeIndex.value = i
// }

const target = ref(null)
const { elementX, elementY, isOutside } = useMouseInElement(target)

const left = ref(0)
const top = ref(0)
const positionX = ref(0)
const positionY = ref(0)

watch([elementX, elementY, isOutside], () => {
  // 确保鼠标在中间图片区域内
  if (isOutside.value) return

  // 获取中间图片容器的尺寸 (这里假设是 400x400)
  const containerWidth = 400;
  const containerHeight = 400;
  const layerSize = 200; // 放大镜层尺寸

  // 计算放大镜层的位置，并限制在容器边界内
  let x = elementX.value - layerSize / 2;
  let y = elementY.value - layerSize / 2;

  // 边界限制
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x > containerWidth - layerSize) x = containerWidth - layerSize;
  if (y > containerHeight - layerSize) y = containerHeight - layerSize;

  left.value = x;
  top.value = y;

  // 计算放大图片背景的位置
  // 放大倍数是 middle 尺寸 / layer 尺寸 = 400 / 200 = 2
  positionX.value = -left.value * 2;
  positionY.value = -top.value * 2;
})
</script>

<template>
  <div class="goods-image">
    <div class="middle" ref="target">
      <!-- 直接使用 imageUrl prop 作为大图的 src -->
      <img :src="imageUrl" alt="" v-if="imageUrl" />
      <div v-else class="placeholder-image">暂无图片</div> <!-- 如果没有图片URL，显示占位符 -->

      <!-- 放大镜层，只有在鼠标在中间图片内且有图片时显示 -->
      <div class="layer" :style="{ left: `${left}px`, top: `${top}px` }" v-show="!isOutside && imageUrl"></div>
    </div>

    <!-- 移除小图列表 -->
    <!-- <ul class="small">
      <li v-for="(img, i) in imageList" :key="i" @mouseenter="enterHandler(i)" :class="{ active: i === activeIndex }">
        <img :src="img" alt="" />
      </li>
    </ul> -->

    <!-- 放大镜区域，只有在鼠标在中间图片内且有图片时显示 -->
    <div class="large" :style="{
      backgroundImage: `url(${imageUrl})`, // 使用 imageUrl 作为背景图
      backgroundPositionX: `${positionX}px`,
      backgroundPositionY: `${positionY}px`
    }" v-show="!isOutside && imageUrl"></div>
  </div>
</template>

<style scoped lang="scss">
.goods-image {
  width: 500px; // 调整宽度以适应只有大图的情况
  min-height: 400px;
  display: flex; // 保持 flex，但现在只有一个子元素 middle
  position: relative;
}

.middle {
  width: 400px; // 大图区域宽度
  height: 400px; // 大图区域高度
  background: #f5f5f5;
  position: relative; /* 关键 */
  // 移除 margin-left，因为没有小图列表了
  // margin-left: 10px;
}

.middle img {
  width: 100%;
  height: 100%;
  object-fit: contain; // 使用 contain 确保图片完整显示
}

.layer {
  width: 200px;
  height: 200px;
  background: rgba(0, 0, 0, 0.3);
  position: absolute;
  // 确保放大镜层在图片上方
  z-index: 1;
}

// 移除 small 相关的样式
// .small { ... }
// .small li { ... }
// .small li.active { ... }
// .small img { ... }


.large {
  position: absolute;
  top: 0;
  left: 420px; // 放大镜区域位置
  width: 400px; // 放大镜区域尺寸
  height: 400px;
  background-size: 800px 800px; // 放大倍数 2x
  background-repeat: no-repeat;
  box-shadow: 0 0 10px rgba(0,0,0,0.2);
  background-color: #fff;
  z-index: 10;
}

// 添加一个占位符样式（可选）
.placeholder-image {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #eee;
  color: #666;
  font-size: 16px;
}
</style>