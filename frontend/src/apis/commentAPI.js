// src/apis/commentAPI.js
import request from '@/utils/http'

/**
 * 根据商品ID获取评论列表
 * @param {string | number} productId - 商品ID
 * @returns Promise
 */
export const getCommentsByProductIdAPI = (productId) => {
    return request({
        // ★★★ 修改这里 ★★★
        // 后端期望的路径是 /products/:productId/comments
        // baseURL 已经是 /api 了，所以这里提供的 url 会拼接在 /api 后面
        // Vite 的 rewrite 会去掉 /api，所以我们需要提供 rewrite 之后能匹配后端路由的路径
        // 因此，url 应该是 'products/' + productId + '/comments'
        // 或者使用模板字符串 ``
        url: `/products/${productId}/comments`,
        method: 'GET',
        // ★★★ 参数传递方式也需要注意 ★★★
        // 你的后端路由 /products/:productId/comments 是通过路径参数 :productId 获取商品ID的，
        // 而不是通过查询参数 product_id。
        // 所以，不需要 params 对象了，productId 已经包含在 url 中。
        // params: {
        //     product_id: productId // 这个可以移除了
        // }
    })
}

/**
 * 提交新评论 (如果需要)
 * @param {object} commentData
 * @param {string | number} commentData.productId - 商品ID (注意这里是 productId)
 * @param {string} commentData.content - 评论内容
 * @param {number} [commentData.rating] - 评分 (可选)
 * @returns Promise
 */
export const addCommentAPI = (commentData) => {
    // ★★★ 同样修改这里 ★★★
    // 后端期望的路径是 /products/:productId/comments
    // productId 需要从 commentData 中获取
    const { productId, ...restData } = commentData; // 解构出 productId，其余的作为 data
    return request({
        url: `/products/${productId}/comments`,
        method: 'POST',
        data: restData // 发送除去 productId 的其他数据
    })
}

/**
 * 删除评论
 * @param {Number|String} commentId - 要删除的评论ID
 * @returns Promise
 */
export const deleteCommentAPI = (commentId) => {
    return request({
        url: `/comments/${commentId}`,
        method: 'DELETE',
        // headers 中会自动带上 token (如果你的 request 实例配置了请求拦截器)
    });
  };