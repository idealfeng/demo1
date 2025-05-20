import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getClothesCategoryAPI } from '@/apis/category'

export const useCategoryStore = defineStore('category', () => {
  const categoryList = ref([])

  // 名字就叫 getCategory，别再改了
  const getCategory = async () => {
    if (categoryList.value.length) return
    const { result } = await getClothesCategoryAPI()
    categoryList.value = result
  }

  return { categoryList, getCategory }
})