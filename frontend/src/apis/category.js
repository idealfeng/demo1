// src/apis/category.js
import clothes from '@/mock/clotherCategory.json' // 仍然需要这个文件作为基础模板

/*
  想显示什么结构，就在 preset 里写什么结构
  ——只用写 name 和 children，其他字段自动补全
*/
const preset = [
    {              // ① 女装
        name: '女装',
        children: ['连衣裙', '半身裙']
    },
    {              // ② 睡衣
        name: '睡衣',
        children: ['家居服', '情侣睡衣']
    },
    {              // ③ 配饰
        name: '配饰',
        children: ['女士围巾', '披肩']
    },
    { name: '男装', children: ['T 恤', '衬衫'] },
    { name: '卫衣', children: ['连帽卫衣', '开衫卫衣'] },
    { name: '裤子', children: ['牛仔裤', '休闲裤'] },
    { name: '外套', children: ['风衣', '夹克'] },
    { name: '鞋靴', children: ['休闲鞋', '运动鞋'] }
]

// === 定义一个二级分类名称到图片路径的映射 ===
const subCategoryPictureMap = {
    '连衣裙': '/category/lianyiqian.jpg', // <-- 替换成你实际的图片路径
    '半身裙': '/category/banshenqun.jpg', // <-- 替换成你实际的图片路径
    '家居服': '/category/jiajufu.jpg',   // <-- 替换成你实际的图片路径
    '情侣睡衣': '/category/qinglvshuiyi.jpg', // <-- 替换成你实际的图片路径
    '女士围巾': '/category/nvshiweijin.jpg', // <-- 替换成你实际的图片路径
    '披肩': '/category/pijian.jpg',     // <-- 替换成你实际的图片路径
    'T 恤': '/category/txu.jpg',       // <-- 替换成你实际的图片路径
    '衬衫': '/category/chenshan.jpg',   // <-- 替换成你实际的图片路径
    '连帽卫衣': '/category/lianmaoweiyi.jpg', // <-- 替换成你实际的图片路径
    '开衫卫衣': '/category/kaishanweiyi.jpg', // <-- 替换成你实际的图片路径
    '牛仔裤': '/category/niuzaiku.jpg',   // <-- 替换成你实际的图片路径
    '休闲裤': '/category/xiuxianku.jpg', // <-- 替换成你实际的图片路径
    '风衣': '/category/fengyi.jpg',     // <-- 替换成你实际的图片路径
    '夹克': '/category/jiake.jpg',     // <-- 替换成你实际的图片路径
    '休闲鞋': '/category/xiuxianxie.jpg', // <-- 替换成你实际的图片路径
    '运动鞋': '/category/yundong.jpg', // <-- 替换成你实际的图片路径
    // === 为 preset 中所有二级分类添加对应的图片路径 ===
    // 如果某个二级分类没有对应的图片，可以给一个默认值
};


/*
  用 mock 数据中的 sub[0] 当模板，把 preset 复制成 8 条完整分类：
  - id 自动生成：2000,2001…
  - name、children 用 preset 自己的
  - goods 不再用模板里的，而是手动创建
*/
let mockProductNumericIdCounter = 10000; // 选择一个与 home.js 不冲突的起始值

const categories = preset.map((item, idx) => {
    let categoryGoods = [];
    const categoryBaseId = 2000 + idx; // 一级分类的基础ID，用于生成商品ID

    // 根据分类名称，手动创建该分类下的商品列表
    switch (item.name) {
        case '女装':
            categoryGoods = [
                // === 修改 ID 为数字 ===
                { id: mockProductNumericIdCounter++, name: '女装商品1', desc: '好看的女装', price: '199.00', picture: '/category/nvzhuang-1.jpg' },
                { id: mockProductNumericIdCounter++, name: '女装商品2', desc: '时尚女装', price: '299.00', picture: '/category/nvzhuang-2.jpg' },
                { id: mockProductNumericIdCounter++, name: '女装商品3', desc: '新款女装', price: '399.00', picture: '/category/nvzhuang-3.jpg' },
                { id: mockProductNumericIdCounter++, name: '女装商品4', desc: '热卖女装', price: '499.00', picture: '/category/nvzhuang-4.jpg' },
            ];
            break;
        case '男装':
            categoryGoods = [
                { id: mockProductNumericIdCounter++, name: '男装商品1', desc: '帅气男装', price: '159.00', picture: '/category/nanzhuang-1.jpg' },
                { id: mockProductNumericIdCounter++, name: '男装商品2', desc: '休闲男装', price: '259.00', picture: '/category/nanzhuang-2.jpg' },
                { id: mockProductNumericIdCounter++, name: '男装商品3', desc: '潮流男装', price: '359.00', picture: '/category/nanzhuang-3.jpg' },
                { id: mockProductNumericIdCounter++, name: '男装商品4', desc: '经典男装', price: '459.00', picture: '/category/nanzhuang-4.jpg' },
            ];
            break;
        case '睡衣':
            categoryGoods = [
                { id: mockProductNumericIdCounter++, name: '睡衣商品1', desc: '情侣睡衣', price: '59.00', picture: '/category/neiyi-1.jpg' },
                { id: mockProductNumericIdCounter++, name: '睡衣商品2', desc: '乌萨奇睡衣', price: '69.00', picture: '/category/neiyi-2.jpg' },
                { id: mockProductNumericIdCounter++, name: '睡衣商品3', desc: '恐龙睡衣', price: '79.00', picture: '/category/neiyi-3.jpg' },
                { id: mockProductNumericIdCounter++, name: '睡衣商品4', desc: '家居服', price: '89.00', picture: '/category/neiyi-4.jpg' },
            ];
            break;
        case '配饰':
            categoryGoods = [
                { id: mockProductNumericIdCounter++, name: '配饰商品1', desc: '围巾', price: '39.00', picture: '/category/peishi-1.jpg' },
                { id: mockProductNumericIdCounter++, name: '配饰商品2', desc: '平平无奇的胸针', price: '49.00', picture: '/category/peishi-2.jpg' },
                { id: mockProductNumericIdCounter++, name: '配饰商品3', desc: '发饰', price: '109.00', picture: '/category/peishi-3.jpg' },
                { id: mockProductNumericIdCounter++, name: '配饰商品4', desc: '手表', price: '59.00', picture: '/category/peishi-4.jpg' },
            ];
            break;
        case 'T恤': // 你 preset 里没有 T恤，但 switch 里有，统一一下
            categoryGoods = [
                { id: mockProductNumericIdCounter++, name: 'T恤商品1', desc: '纯棉T恤', price: '69.00', picture: '/category/txu-1.jpg' },
                { id: mockProductNumericIdCounter++, name: 'T恤商品2', desc: '印花T恤', price: '79.00', picture: '/category/txu-2.jpg' },
                { id: mockProductNumericIdCounter++, name: 'T恤商品3', desc: '条纹T恤', price: '89.00', picture: '/category/txu-3.jpg' },
                { id: mockProductNumericIdCounter++, name: 'T恤商品4', desc: 'POLO衫', price: '99.00', picture: '/category/txu-4.jpg' },
            ];
            break;
        case '卫衣':
            categoryGoods = [
                { id: mockProductNumericIdCounter++, name: '卫衣商品1', desc: '连帽卫衣', price: '129.00', picture: '/category/weiyi-1.jpg' },
                { id: mockProductNumericIdCounter++, name: '卫衣商品2', desc: '开衫卫衣', price: '139.00', picture: '/category/weiyi-2.jpg' },
                { id: mockProductNumericIdCounter++, name: '卫衣商品3', desc: '圆领卫衣', price: '149.00', picture: '/category/weiyi-3.jpg' },
                { id: mockProductNumericIdCounter++, name: '卫衣商品4', desc: '套头卫衣', price: '159.00', picture: '/category/weiyi-4.jpg' },
            ];
            break;
        case '裤子':
            categoryGoods = [
                { id: mockProductNumericIdCounter++, name: '裤子商品1', desc: '牛仔裤', price: '189.00', picture: '/category/kuzi-1.jpg' },
                { id: mockProductNumericIdCounter++, name: '裤子商品2', desc: '休闲裤', price: '199.00', picture: '/category/kuzi-2.jpg' },
                { id: mockProductNumericIdCounter++, name: '裤子商品3', desc: '运动裤', price: '209.00', picture: '/category/kuzi-3.jpg' },
                { id: mockProductNumericIdCounter++, name: '裤子商品4', desc: '短裤', price: '109.00', picture: '/category/kuzi-4.jpg' },
            ];
            break;
        case '外套':
            categoryGoods = [
                { id: mockProductNumericIdCounter++, name: '外套商品1', desc: '风衣', price: '289.00', picture: '/category/waitao-1.jpg' },
                { id: mockProductNumericIdCounter++, name: '外套商品2', desc: '夹克', price: '299.00', picture: '/category/waitao-2.jpg' },
                { id: mockProductNumericIdCounter++, name: '外套商品3', desc: '羽绒服', price: '589.00', picture: '/category/waitao-3.jpg' },
                { id: mockProductNumericIdCounter++, name: '外套商品4', desc: '棉服', price: '389.00', picture: '/category/waitao-4.jpg' },
            ];
            break;
        // case '牛仔': // 你的 preset 里没有 '牛仔' 这个一级分类，如果需要，请在 preset 中添加
        //     categoryGoods = [
        //         { id: mockProductNumericIdCounter++, name: '牛仔商品1', desc: '牛仔外套', price: '229.00', picture: '/category/niuzai-1.jpg' },
        //         // ...
        //     ];
        //     break;
        case '鞋靴':
            categoryGoods = [
                { id: mockProductNumericIdCounter++, name: '鞋靴商品1', desc: '休闲鞋', price: '169.00', picture: '/category/xiexue-1.jpg' },
                { id: mockProductNumericIdCounter++, name: '鞋靴商品2', desc: '运动鞋', price: '269.00', picture: '/category/xiexue-2.jpg' },
                { id: mockProductNumericIdCounter++, name: '鞋靴商品3', desc: '皮鞋', price: '369.00', picture: '/category/xiexue-3.jpg' },
                { id: mockProductNumericIdCounter++, name: '鞋靴商品4', desc: '靴子', price: '469.00', picture: '/category/xiexue-4.jpg' },
            ];
            break;
        default:
            categoryGoods = [
                { id: mockProductNumericIdCounter++, name: '默认商品1', desc: '通用商品', price: '99.00', picture: '/category/default-1.jpg' },
                { id: mockProductNumericIdCounter++, name: '默认商品2', desc: '通用商品', price: '99.00', picture: '/category/default-2.jpg' },
                { id: mockProductNumericIdCounter++, name: '默认商品3', desc: '通用商品', price: '99.00', picture: '/category/default-3.jpg' },
                { id: mockProductNumericIdCounter++, name: '默认商品4', desc: '通用商品', price: '99.00', picture: '/category/default-4.jpg' },
            ];
            break;
    }

    return {
        id: categoryBaseId, // 一级分类ID
        name: item.name,
        picture: '',
        saleInfo: '满100减10',
        goods: categoryGoods, // 使用包含数字ID的商品列表
        children: item.children.map((c, i) => {
            const subCategoryName = c;
            const subCategoryPicture = subCategoryPictureMap[subCategoryName] || '/category/sub/default.jpg';
            return {
                id: categoryBaseId * 10 + i, // 二级分类ID
                name: subCategoryName,
                picture: subCategoryPicture
            };
        })
    }
});

console.log('category.js 生成的 categories 数组 (商品ID应为数字):', categories);
if (categories[0] && categories[0].goods && categories[0].goods[0]) {
    console.log('category.js 生成的第一个分类的第一个商品 ID:', categories[0].goods[0].id, typeof categories[0].goods[0].id);
}


export const getClothesCategoryAPI = () =>
    Promise.resolve({ result: categories })

export const getTopCategoryAPI = (id) =>
    Promise.resolve({
        result: categories.find(c => c.id === Number(id)) || categories[0]
    })

export const getClothesLeftAPI = () =>
    Promise.resolve({ result: categories })

export { categories };