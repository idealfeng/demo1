import { categories } from '@/apis/category'; // <-- 导入 categories

/* “假接口”：按 id 查一条；或取前 N 条当热门 */
export const getGoodsById = (id) => {
    // 1. 合并 goodsList (来自 goods.js) 和 category.js 生成的商品列表
    const allCategoryGoods = categories.flatMap(cate => cate.goods || []); // 扁平化 category.js 的商品列表，确保 cate.goods 存在
    const allAvailableGoods = [...goodsList, ...allCategoryGoods]; // 合并两个列表

    // 2. 在合并后的列表中查找商品
    // 使用 == 宽松比较，可以处理数字 ID 和字符串 ID 的情况
    const foundGood = allAvailableGoods.find(g => g.id == id);

    // 3. 如果找到商品，返回它；否则返回 null 或默认值
    // 添加路径修正：如果 picture 以 .jpg 结尾，尝试修正为 .jpg（可选，根据实际情况）
    if (foundGood) {
        const correctedGood = {
            ...foundGood,
            picture: foundGood.picture.replace('.jpg', '.jpg'), // 修正后缀，如果你的图片是 .jpg 格式
            // 如果 details.pictures 也需要修正，可以在这里处理
        };
        return Promise.resolve({ result: correctedGood });
    } else {
        return Promise.resolve({ result: null }); // 返回 null 表示未找到
    }
};

export const goodsList = [
    {
        id: 10001,
        title: '爆款连衣裙',
        alt: '夏日显瘦、百搭必入',
        name: '爆款连衣裙',
        desc: '夏日显瘦、百搭必入',
        price: '199.00',
        oldPrice: '299.00',
        picture: '/category/连衣裙3.jpg',
        salesCount: 321,
        commentCount: 56,
        collectCount: 40,
        brand: { name: '热砂的时刻' },
        categories: [
            { id: 2000, name: '女装' },
            { id: 2010, name: '连衣裙' }
        ],
        details: {
            properties: [
                { name: '材质', value: '100%棉' },
                { name: '厚度', value: '薄款' }
            ],
            pictures: [
                '/category/连衣裙3.jpg',
  
            ]
        }
    },
    {
        id: 10002,
        title: '时尚T恤',
        alt: '舒适百搭',
        name: '时尚T恤',
        desc: '舒适百搭',
        price: '99.00',
        oldPrice: '149.00',
        picture: '/category/T恤.jpg',
        salesCount: 210,
        commentCount: 30,
        collectCount: 20,
        brand: { name: '蓝调的时刻' },
        categories: [
            { id: 2000, name: '女装' },
            { id: 2020, name: 'T恤' }
        ],
        details: {
            properties: [
                { name: '材质', value: '棉' },
                { name: '厚度', value: '常规' }
            ],
            pictures: [
                '/category/T恤.jpg',
               
            ]
        }
    },
    {
        id: 10003,
        title: '休闲牛仔裤',
        alt: '潮流百搭',
        name: '休闲牛仔裤',
        desc: '潮流百搭',
        price: '159.00',
        oldPrice: '199.00',
        picture: '/category/牛仔裤.jpg',
        salesCount: 180,
        commentCount: 25,
        collectCount: 15,
        brand: { name: '薄暮的时刻' },
        categories: [
            { id: 2000, name: '女装' },
            { id: 2030, name: '牛仔裤' }
        ],
        details: {
            properties: [
                { name: '材质', value: '牛仔布' },
                { name: '厚度', value: '常规' }
            ],
            pictures: [
                '/category/牛仔裤.jpg',
              
            ]
        }
    },
    {
        id: 10004,
        title: '轻盈运动鞋',
        alt: '出行必备',
        name: '轻盈运动鞋',
        desc: '出行必备',
        price: '259.00',
        oldPrice: '399.00',
        picture: '/category/运动鞋.jpg',
        salesCount: 482,
        commentCount: 87,
        collectCount: 65,
        brand: { name: '白日梦' },
        categories: [
            { id: 3000, name: '鞋靴' },
            { id: 3010, name: '运动鞋' }
        ],
        details: {
            properties: [
                { name: '材质', value: '飞织面料' },
                { name: '鞋底', value: '橡胶' }
            ],
            pictures: [
                '/category/运动鞋.jpg',
          
            ]
        }
    },
    {
        id: 10005,
        title: '轻奢小方包',
        alt: '百搭出街，质感首选',
        name: '轻奢小方包',
        desc: '百搭出街，质感首选',
        price: '489.00',
        oldPrice: '699.00',
        picture: '/category/小方包.jpg',
        salesCount: 312,
        commentCount: 60,
        collectCount: 45,
        brand: { name: '蔻丽' },
        categories: [
            { id: 6000, name: '箱包' },
            { id: 6020, name: '单肩斜挎包' }
        ],
        details: {
            properties: [
                { name: '材质', value: '头层牛皮' },
                { name: '容量', value: '可放手机和钱包' }
            ],
            pictures: [
                '/category/小方包.jpg',
                '/bag3.jpg'
            ]
        }
    },
    {
        id: 10006,
        title: '简约珍珠项链',
        alt: '优雅气质，精致之选',
        name: '简约珍珠项链',
        desc: '优雅气质，精致之选',
        price: '329.00',
        oldPrice: '499.00',
        picture: '/category/项链.jpg',
        salesCount: 220,
        commentCount: 48,
        collectCount: 35,
        brand: { name: '珠蒂' },
        categories: [
            { id: 7000, name: '配饰' },
            { id: 7010, name: '项链' }
        ],
        details: {
            properties: [
                { name: '材质', value: '925银+淡水珍珠' },
                { name: '长度', value: '40cm+5cm延长链' }
            ],
            pictures: [
                '/category/项链.jpg',
                '/necklace2.jpg'
            ]
        }
    },
    {
        id: 10007,
        title: '平平无奇的帽子',
        alt: '遮阳凹造型，两不误',
        name: '平平无奇的帽子',
        desc: '遮阳凹造型，两不误',
        price: '129.00',
        oldPrice: '199.00',
        picture: '/category/帽子.jpg',
        salesCount: 189,
        commentCount: 30,
        collectCount: 27,
        brand: { name: '帽尚' },
        categories: [
            { id: 8000, name: '配饰' },
            { id: 8010, name: '帽子' }
        ],
        details: {
            properties: [
                { name: '材质', value: '棉麻混纺' },
                { name: '特点', value: '可折叠收纳' }
            ],
            pictures: [
                '/category/帽子.jpg',
                '/hat2.jpg'
            ]
        }
    },
    {
        id: 10008,
        title: '时尚极简手表',
        alt: '轻奢风格，质感随行',
        name: '时尚极简手表',
        desc: '轻奢风格，质感随行',
        price: '599.00',
        oldPrice: '899.00',
        picture: '/category/钟表.jpg',
        salesCount: 278,
        commentCount: 55,
        collectCount: 42,
        brand: { name: '时光礼' },
        categories: [
            { id: 9000, name: '配饰' },
            { id: 9010, name: '手表' }
        ],
        details: {
            properties: [
                { name: '机芯', value: '日本石英机芯' },
                { name: '表带材质', value: '真皮表带' }
            ],
            pictures: [
                '/category/钟表.jpg',
                '/watch2.jpg'
            ]
        }
    }


]

/* “假接口”：按 id 查一条；或取前 N 条当热门 */


export const getHotList = (limit = 4) =>
    Promise.resolve({ result: goodsList.slice(0, limit) });

/* “假接口”：取后 N 条当新鲜 */
export const getNewList = (limit = 4) =>
    Promise.resolve({ result: goodsList.slice(-limit) }); // 修改为从末尾取数据，确保取到最新的商品