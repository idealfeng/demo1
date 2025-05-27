-- -----------------------------------------------------------------------------
-- 数据库和用户初始化
-- -----------------------------------------------------------------------------
SET NAMES 'utf8mb4';
SET CHARACTER SET utf8mb4;
-- 创建业务数据库
CREATE DATABASE IF NOT EXISTS demo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建业务账号并授权
-- 注意：这里的密码 'feng0831' 需要与用户在 .env 文件中配置的 DB_PASS 一致
CREATE USER IF NOT EXISTS 'demo_user'@'%' IDENTIFIED BY 'feng0831';
GRANT ALL PRIVILEGES ON demo.* TO 'demo_user'@'%';
FLUSH PRIVILEGES;

-- 切换到 demo 数据库上下文
USE demo;

-- -----------------------------------------------------------------------------
-- 表结构创建
-- -----------------------------------------------------------------------------

-- 用户表
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    token VARCHAR(100) UNIQUE,
    avatar_url VARCHAR(255) NULL DEFAULT NULL COMMENT '用户头像URL' -- 合并了 ALTER TABLE 的修改
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 商品分类表
CREATE TABLE categories(
    id INT AUTO_INCREMENT PRIMARY KEY ,
    name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 商品表
CREATE TABLE IF NOT EXISTS goods (
    id INT PRIMARY KEY, -- 注意：你这里 goods.id 是 INT，但在 cart 和 comments 中 product_id 是 VARCHAR。需要注意一致性或转换。
    title VARCHAR(100) NOT NULL,
    alt VARCHAR(200),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(200),
    price DECIMAL(10,2) NOT NULL,
    old_price DECIMAL(10,2),
    picture VARCHAR(255),
    sales_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    collect_count INT DEFAULT 0,
    brand_name VARCHAR(50),
    category_ids VARCHAR(100),
    category_names VARCHAR(200),
    properties JSON,
    pictures JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; -- 确保使用 utf8mb4

-- 收藏表
CREATE TABLE favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id VARCHAR(255) NOT NULL, -- 与 goods.id 类型保持一致性考虑
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  product_picture VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_favorite (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 购物车表
CREATE TABLE IF NOT EXISTS cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id VARCHAR(50) NOT NULL, -- 与 goods.id 类型保持一致性考虑
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    product_picture VARCHAR(255),
    quantity INT NOT NULL DEFAULT 1,
    selected BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 租赁订单表
CREATE TABLE IF NOT EXISTS rental_orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    product_id VARCHAR(255) NOT NULL, -- 与 goods.id 类型保持一致性考虑
    product_name VARCHAR(255) NOT NULL,
    product_picture VARCHAR(255),
    rental_price DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2) NOT NULL,
    days INT NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    rentalFee DECIMAL(10,2) NOT NULL,
    totalAmount DECIMAL(10,2) NOT NULL,
    status ENUM('待发货', '租用中', '待归还', '已归还', '已取消') 
        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci 
        NOT NULL DEFAULT '待发货',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    returnDate DATE NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 评论表
-- DROP TABLE IF EXISTS comments; -- 如果确定是初始化脚本，第一次运行时不需要 DROP
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL, -- 与 goods.id 类型保持一致性考虑
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    star_rating TINYINT UNSIGNED NULL DEFAULT NULL COMMENT '星级评分 (1-5)', -- 合并了 ALTER TABLE 的修改
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- -----------------------------------------------------------------------------
-- 插入初始数据
-- -----------------------------------------------------------------------------



-- 插入商品分类数据
INSERT INTO categories(name) VALUES
('新鲜好物'), ('人气推荐'), ('女装'), ('睡衣'), ('配饰'),
('男装'), ('卫衣'), ('裤子'), ('外套'), ('鞋靴');

-- 插入商品数据 (部分示例，你可以根据需要添加更多)
-- 插入goodsList中的详细商品
INSERT INTO goods
(id, title, alt, name, description, price, old_price, picture, sales_count, comment_count, collect_count, brand_name, category_ids, category_names, properties, pictures)
VALUES
(10001, '爆款连衣裙', '夏日显瘦、百搭必入', '爆款连衣裙', '夏日显瘦、百搭必入', 199.00, 299.00, '/category/连衣裙3.jpg', 321, 56, 40, '热砂的时刻', '3', '女装', '[{"name":"材质","value":"100%棉"},{"name":"厚度","value":"薄款"}]', '["/category/连衣裙3.jpg"]'),

(10002, '时尚T恤', '舒适百搭', '时尚T恤', '舒适百搭', 99.00, 149.00, '/category/T恤.jpg', 210, 30, 20, '蓝调的时刻', '3', '女装', '[{"name":"材质","value":"棉"},{"name":"厚度","value":"常规"}]', '["/category/T恤.jpg"]'),

(10003, '休闲牛仔裤', '潮流百搭', '休闲牛仔裤', '潮流百搭', 159.00, 199.00, '/category/牛仔裤.jpg', 180, 25, 15, '薄暮的时刻', '3', '女装', '[{"name":"材质","value":"牛仔布"},{"name":"厚度","value":"常规"}]', '["/category/牛仔裤.jpg"]'),

(10004, '轻盈运动鞋', '出行必备', '轻盈运动鞋', '出行必备', 259.00, 399.00, '/category/运动鞋.jpg', 482, 87, 65, '白日梦', '10', '鞋靴', '[{"name":"材质","value":"飞织面料"},{"name":"鞋底","value":"橡胶"}]', '["/category/运动鞋.jpg"]'),

(10005, '轻奢小方包', '百搭出街，质感首选', '轻奢小方包', '百搭出街，质感首选', 489.00, 699.00, '/category/小方包.jpg', 312, 60, 45, '蔻丽', '5', '配饰', '[{"name":"材质","value":"头层牛皮"},{"name":"容量","value":"可放手机和钱包"}]', '["/category/小方包.jpg","/bag3.jpg"]'),

(10006, '简约珍珠项链', '优雅气质，精致之选', '简约珍珠项链', '优雅气质，精致之选', 329.00, 499.00, '/category/项链.jpg', 220, 48, 35, '珠蒂', '5', '配饰', '[{"name":"材质","value":"925银+淡水珍珠"},{"name":"长度","value":"40cm+5cm延长链"}]', '["/category/项链.jpg","/necklace2.jpg"]'),

(10007, '平平无奇的帽子', '遮阳凹造型，两不误', '平平无奇的帽子', '遮阳凹造型，两不误', 129.00, 199.00, '/category/帽子.jpg', 189, 30, 27, '帽尚', '5', '配饰', '[{"name":"材质","value":"棉麻混纺"},{"name":"特点","value":"可折叠收纳"}]', '["/category/帽子.jpg","/hat2.jpg"]'),

(10008, '时尚极简手表', '轻奢风格，质感随行', '时尚极简手表', '轻奢风格，质感随行', 599.00, 899.00, '/category/钟表.jpg', 278, 55, 42, '时光礼', '5', '配饰', '[{"name":"机芯","value":"日本石英机芯"},{"name":"表带材质","value":"真皮表带"}]', '["/category/钟表.jpg","/watch2.jpg"]');

-- 插入按类别组织的女装商品
INSERT INTO goods
(id, title, name, description, price, picture, category_ids, category_names, properties, pictures)
VALUES
(20001, '女装商品1', '女装商品1', '好看的女装', 199.00, '/category/nvzhuang-1.jpg', '3', '女装', '[]', '["/category/nvzhuang-1.jpg"]'),
(20002, '女装商品2', '女装商品2', '时尚女装', 299.00, '/category/nvzhuang-2.jpg', '3', '女装', '[]', '["/category/nvzhuang-2.jpg"]'),
(20003, '女装商品3', '女装商品3', '新款女装', 399.00, '/category/nvzhuang-3.jpg', '3', '女装', '[]', '["/category/nvzhuang-3.jpg"]'),
(20004, '女装商品4', '女装商品4', '热卖女装', 499.00, '/category/nvzhuang-4.jpg', '3', '女装', '[]', '["/category/nvzhuang-4.jpg"]');

-- 插入按类别组织的男装商品
INSERT INTO goods
(id, title, name, description, price, picture, category_ids, category_names, properties, pictures)
VALUES
(30001, '男装商品1', '男装商品1', '帅气男装', 159.00, '/category/nanzhuang-1.jpg', '6', '男装', '[]', '["/category/nanzhuang-1.jpg"]'),
(30002, '男装商品2', '男装商品2', '休闲男装', 259.00, '/category/nanzhuang-2.jpg', '6', '男装', '[]', '["/category/nanzhuang-2.jpg"]'),
(30003, '男装商品3', '男装商品3', '潮流男装', 359.00, '/category/nanzhuang-3.jpg', '6', '男装', '[]', '["/category/nanzhuang-3.jpg"]'),
(30004, '男装商品4', '男装商品4', '经典男装', 459.00, '/category/nanzhuang-4.jpg', '6', '男装', '[]', '["/category/nanzhuang-4.jpg"]');

-- 插入按类别组织的睡衣商品
INSERT INTO goods
(id, title, name, description, price, picture, category_ids, category_names, properties, pictures)
VALUES
(40001, '睡衣商品1', '睡衣商品1', '情侣睡衣', 59.00, '/category/neiyi-1.jpg', '4', '睡衣', '[]', '["/category/neiyi-1.jpg"]'),
(40002, '睡衣商品2', '睡衣商品2', '乌萨奇睡衣', 69.00, '/category/neiyi-2.jpg', '4', '睡衣', '[]', '["/category/neiyi-2.jpg"]'),
(40003, '睡衣商品3', '睡衣商品3', '恐龙睡衣', 79.00, '/category/neiyi-3.jpg', '4', '睡衣', '[]', '["/category/neiyi-3.jpg"]'),
(40004, '睡衣商品4', '睡衣商品4', '家居服', 89.00, '/category/neiyi-4.jpg', '4', '睡衣', '[]', '["/category/neiyi-4.jpg"]');

-- 插入按类别组织的配饰商品
INSERT INTO goods
(id, title, name, description, price, picture, category_ids, category_names, properties, pictures)
VALUES
(50001, '配饰商品1', '配饰商品1', '围巾', 39.00, '/category/peishi-1.jpg', '5', '配饰', '[]', '["/category/peishi-1.jpg"]'),
(50002, '配饰商品2', '配饰商品2', '平平无奇的胸针', 49.00, '/category/peishi-2.jpg', '5', '配饰', '[]', '["/category/peishi-2.jpg"]'),
(50003, '配饰商品3', '配饰商品3', '发饰', 109.00, '/category/peishi-3.jpg', '5', '配饰', '[]', '["/category/peishi-3.jpg"]'),
(50004, '配饰商品4', '配饰商品4', '手表', 59.00, '/category/peishi-4.jpg', '5', '配饰', '[]', '["/category/peishi-4.jpg"]');

-- 插入按类别组织的卫衣商品
INSERT INTO goods
(id, title, name, description, price, picture, category_ids, category_names, properties, pictures)
VALUES
(60001, '卫衣商品1', '卫衣商品1', '连帽卫衣', 129.00, '/category/weiyi-1.jpg', '7', '卫衣', '[]', '["/category/weiyi-1.jpg"]'),
(60002, '卫衣商品2', '卫衣商品2', '开衫卫衣', 139.00, '/category/weiyi-2.jpg', '7', '卫衣', '[]', '["/category/weiyi-2.jpg"]'),
(60003, '卫衣商品3', '卫衣商品3', '圆领卫衣', 149.00, '/category/weiyi-3.jpg', '7', '卫衣', '[]', '["/category/weiyi-3.jpg"]'),
(60004, '卫衣商品4', '卫衣商品4', '套头卫衣', 159.00, '/category/weiyi-4.jpg', '7', '卫衣', '[]', '["/category/weiyi-4.jpg"]');

-- 插入按类别组织的裤子商品
INSERT INTO goods
(id, title, name, description, price, picture, category_ids, category_names, properties, pictures)
VALUES
(70001, '裤子商品1', '裤子商品1', '牛仔裤', 189.00, '/category/kuzi-1.jpg', '8', '裤子', '[]', '["/category/kuzi-1.jpg"]'),
(70002, '裤子商品2', '裤子商品2', '休闲裤', 199.00, '/category/kuzi-2.jpg', '8', '裤子', '[]', '["/category/kuzi-2.jpg"]'),
(70003, '裤子商品3', '裤子商品3', '运动裤', 209.00, '/category/kuzi-3.jpg', '8', '裤子', '[]', '["/category/kuzi-3.jpg"]'),
(70004, '裤子商品4', '裤子商品4', '短裤', 109.00, '/category/kuzi-4.jpg', '8', '裤子', '[]', '["/category/kuzi-4.jpg"]');

-- 插入按类别组织的外套商品
INSERT INTO goods
(id, title, name, description, price, picture, category_ids, category_names, properties, pictures)
VALUES
(80001, '外套商品1', '外套商品1', '风衣', 289.00, '/category/waitao-1.jpg', '9', '外套', '[]', '["/category/waitao-1.jpg"]'),
(80002, '外套商品2', '外套商品2', '夹克', 299.00, '/category/waitao-2.jpg', '9', '外套', '[]', '["/category/waitao-2.jpg"]'),
(80003, '外套商品3', '外套商品3', '羽绒服', 589.00, '/category/waitao-3.jpg', '9', '外套', '[]', '["/category/waitao-3.jpg"]'),
(80004, '外套商品4', '外套商品4', '棉服', 389.00, '/category/waitao-4.jpg', '9', '外套', '[]', '["/category/waitao-4.jpg"]');

-- 插入按类别组织的鞋靴商品
INSERT INTO goods
(id, title, name, description, price, picture, category_ids, category_names, properties, pictures)
VALUES
(90001, '鞋靴商品1', '鞋靴商品1', '休闲鞋', 169.00, '/category/xiexue-1.jpg', '10', '鞋靴', '[]', '["/category/xiexue-1.jpg"]'),
(90002, '鞋靴商品2', '鞋靴商品2', '运动鞋', 269.00, '/category/xiexue-2.jpg', '10', '鞋靴', '[]', '["/category/xiexue-2.jpg"]'),
(90003, '鞋靴商品3', '鞋靴商品3', '皮鞋', 369.00, '/category/xiexue-3.jpg', '10', '鞋靴', '[]', '["/category/xiexue-3.jpg"]'),
(90004, '鞋靴商品4', '鞋靴商品4', '靴子', 469.00, '/category/xiexue-4.jpg', '10', '鞋靴', '[]', '["/category/xiexue-4.jpg"]');


-- -----------------------------------------------------------------------------
-- 脚本结束提示 (可选，方便在日志中查看)
-- -----------------------------------------------------------------------------
SELECT 'Database initialization script completed.' AS status;