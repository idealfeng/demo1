import http from '@/utils/http'

/* ——— 保留的三个线上接口 ——— */
export function getBannerAPI(distributionSite = '1') {
    return http.get('/home/banner', { params: { distributionSite } })
}
export const getNewAPI = () => http.get('/home/new')
export const getHotAPI = () => http.get('/home/hot')

/* ——— 本地 mock：8 个服饰板块，每块 4 张图 ——— */
export const getGoodsAPI = () => {
    const titles = ['女装', '男装', 'T恤', '衬衫', '裙子', '卫衣', '外套', '牛仔']

    const imgMap = {
        女装: [
            'category/nvzhuang-1.jpg',
            'category/nvzhuang-2.jpg',
            'category/nvzhuang-3.jpg',
            'category/nvzhuang-4.jpg',
        ],
        男装: [
            'category/nanzhuang-1.jpg',
            'category/nanzhuang-2.jpg',
            'category/nanzhuang-3.jpg',
            'category/nanzhuang-4.jpg',
        ],
        T恤: [
            'category/txu-1.jpg',
            'category/txu-2.jpg',
            'category/txu-3.jpg',
            'category/txu-4.jpg',
        ],
        衬衫: [
            'category/chenshan1.jpg',
            'category/chenshan2.jpg',
            'category/chenshan3.jpg',
            'category/chenshan4.jpg',
        ],
        裙子: [
            'category/qunzi1.png',
            'category/qunzi2.jpg',
            'category/qunzi3.jpg',
            'category/qunzi4.jpg',
        ],
        卫衣: [
            'category/weiyi-1.jpg',
            'category/weiyi-2.jpg',
            'category/weiyi-3.jpg',
            'category/weiyi-4.jpg',
        ],
        外套: [
            'category/waitao-1.jpg',
            'category/waitao-2.jpg',
            'category/waitao-3.jpg',
            'category/waitao-4.jpg',
        ],
        牛仔: [
            'category/niuzai-1.jpg',
            'category/niuzai-2.jpg',
            'category/niuzai-3.jpg',
            'category/niuzai-4.jpg',
        ]
    }

    let mockNumericIdCounter = 7000; // 给模拟商品一个起始数字ID，确保不与真实ID冲突

    const result = titles.map((title, cIdx) => ({
        id: 5000 + cIdx, // 分类ID
        name: title,
        goods: imgMap[title].map((pic, gIdx) => ({
            // === 关键修改：确保商品 ID 是数字 ===
            id: mockNumericIdCounter++, // 使用递增的数字ID
            // 或者，如果你想基于分类和商品索引生成唯一的数字ID，可以这样：
            // id: parseInt(`${5000 + cIdx}${gIdx}`), // 例如：女装第一个商品ID 50000, 第二个 50001
            name: `${title}商品${gIdx + 1}`,
            desc: `${title}精选好物`,
            price: (99 + gIdx).toFixed(2), // 确保价格是字符串或数字
            picture: `/${pic}`
        }))
    }));

    return Promise.resolve({ result });
};

// ... 其他 mock 函数保持不变 ...