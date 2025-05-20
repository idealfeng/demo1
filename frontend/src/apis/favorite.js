import request from '@/utils/http'

// 获取收藏列表
export const getFavoritesAPI = () => {
    return request({
        url: '/favorites',
        method: 'get'
    })
}

// 检查是否已收藏 - 直接返回结果，不做额外处理
export const checkFavoriteAPI = (id) => {
    return request({
        url: '/favorites',
        method: 'get'
    }).then(res => {
        if (res && res.code === 0 && res.data) {
            return res.data // 直接返回数据数组
        }
        return []
    })
}

// 添加收藏
export const addFavoriteAPI = (product) => {
    return request({
        url: '/favorites',
        method: 'post',
        data: product
    })
}

// 取消收藏
export const removeFavoriteAPI = (id) => {
    return request({
        url: `/favorites/${id}`,
        method: 'delete'
    })
}