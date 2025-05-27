import 'dotenv/config';
import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs';
// server.js
import fs from 'fs'; // 需要导入 fs 模块

try {
    console.log('>>> DEBUG: Current working directory:', process.cwd());
    console.log('>>> DEBUG: Contents of /app:', fs.readdirSync('/app').join(', '));
    console.log('>>> DEBUG: Contents of /app/node_modules:', fs.readdirSync('/app/node_modules').join(', ').substring(0, 500) + '...'); // 只显示一部分
    console.log('>>> DEBUG: Stat of /app/node_modules/dotenv:', JSON.stringify(fs.statSync('/app/node_modules/dotenv')));
    console.log('>>> DEBUG: Contents of /app/node_modules/dotenv:', fs.readdirSync('/app/node_modules/dotenv').join(', '));
} catch (e) {
    console.error('>>> DEBUG: Error during pre-import debug:', e);
}

import 'dotenv/config'; // 你的原始导入
const app = express()
app.use(cors({
    origin: '*',  // 允许所有来源访问
    methods: ['GET', 'POST', 'PUT','DELETE'], // 添加DELETE方法支持
    credentials: true
}))
app.use(express.json())

app.get('/', (req, res) => {
    res.send('后端服务器运行正常!')
})
app.get('/api/ping', (req, res) => {
    console.log('Accessed /api/ping'); // Add a log here for debugging
    res.json({ msg: 'pong' });
});

// 创建MySQL连接池
const pool = mysql.createPool({
    host: process.env.DB_HOST,      // ←—
    user: process.env.DB_USER,      // ←—
    password: process.env.DB_PASS,  // ←—
    database: process.env.DB_NAME,  // ←—
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4' // <--- 添加这一行！！
})

// 预设的默认头像列表 (如果用户没有设置头像，后端会随机选一个)--------------------------
// 这些路径应该是前端可以访问到的图片路径，例如放在前端项目的 public 目录下
const defaultAvatars = [
    '/avatar/开拓者.png',
    '/avatar/三月妻.png',
    '/avatar/花火.jpg',
    '/avatar/布洛妮娅.jpg',
    '/avatar/丹恒.png',
    '/avatar/符玄.jpg',
    '/avatar/姬子.png',
    '/avatar/景元.jpg',
    '/avatar/镜流.jpg',
    '/avatar/卡芙卡.jpg',
    '/avatar/流萤.jpg',
    '/avatar/刃.jpg',
    '/avatar/缇宝.png',
    '/avatar/瓦尔特.png',
    '/avatar/遐蝶.png',
    '/avatar/星期日.jpg',
    '/avatar/彦卿.jpg',
    '/avatar/银狼.jpg',
    '/avatar/知更鸟.jpg',
  ];
// 我们之前定义的 reinitializeOrderStatusColumn 函数
async function reinitializeOrderStatusColumn() {
    let connection; // 将 connection 移到 try 外部，以便 finally 中可以访问
    try {
        connection = await pool.getConnection(); // 获取连接
        console.log(">>> Attempting to reinitialize 'status' column via Node.js...");

        await connection.query("SET NAMES 'utf8mb4';");
        console.log(">>> Executed SET NAMES 'utf8mb4';");

        try {
            await connection.query("ALTER TABLE rental_orders DROP COLUMN status;");
            console.log(">>> 'status' column dropped successfully or did not exist.");
        } catch (dropError) {
            console.warn(">>> INFO: Error dropping 'status' column (might not exist, or other issue):", dropError.message);
            if (dropError.code !== 'ER_CANT_DROP_FIELD_OR_KEY' && dropError.errno !== 1091 /*MySQL specific for cant drop*/) {
                // 如果不是 "列不存在" 相关的错误，则可能是其他问题，选择抛出让外层处理或记录
                console.error(">>> Significant error during DROP COLUMN, rethrowing:", dropError);
                throw dropError;
            }
        }

        const addColumnSQL = `
            ALTER TABLE rental_orders 
            ADD COLUMN status ENUM('待发货','租用中','待归还','已归还','已取消') 
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '待发货';
        `;
        await connection.query(addColumnSQL);
        console.log(">>> 'status' column re-added successfully with ENUM definition via Node.js.");
        console.log(">>> SUCCESS! Please REMOVE or COMMENT OUT the call to reinitializeOrderStatusColumn() after this successful run!");

    } catch (error) {
        console.error(">>> CRITICAL ERROR in reinitializeOrderStatusColumn:", error);
    } finally {
        if (connection) {
            console.log(">>> Releasing connection in reinitializeOrderStatusColumn.");
            connection.release();
        }
    }
}
// 测试数据库连接
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testConnection(retries = 5, delay = 5000) { // 默认重试5次，每次间隔5秒
    for (let i = 0; i < retries; i++) {
        let connection;
        try {
            console.log(`>>> Attempting database connection (Attempt ${i + 1}/${retries})...`);
            connection = await pool.getConnection();
            console.log('数据库连接成功 (from testConnection)');
            if (connection) connection.release(); // 确保释放连接
            return true;
        } catch (error) {
            console.error(`数据库连接失败 (Attempt ${i + 1}/${retries}):`, error.message); // 只打印关键错误信息
            if (i < retries - 1) {
                console.log(`>>> Retrying in ${delay / 1000} seconds...`);
                await sleep(delay);
            } else {
                console.error('>>> All database connection attempts failed.');
                // 依然可以在 initializeApp 中处理 process.exit(1)
                return false;
            }
        } finally {
            // 从 try/catch 中移出，以避免在成功时也执行
            // if (connection) {
            //     console.log(">>> Releasing connection in testConnection (finally block).");
            //     connection.release();
            // }
        }
    }
    return false; // 应该不会执行到这里
}

// 创建收藏表（如果不存在）
async function initFavoritesTable() {
    let connection; // <--- 修正：在这里声明 
    try {
        const connection = await pool.getConnection()
        await connection.query(`
            CREATE TABLE IF NOT EXISTS favorites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                product_price DECIMAL(10,2) NOT NULL,
                product_picture VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_favorite (user_id, product_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `)
        connection.release()
        console.log('>>> 收藏表初始化成功 (from initFavoritesTable)'); // 修改日志前缀方便识别
    } catch (error) {
        console.error('>>> 收藏表初始化失败 (from initFavoritesTable):', error);
    } finally {
        if (connection) { // <--- 现在 connection 是已声明的了
            console.log(">>> Releasing connection in initFavoritesTable.");
            connection.release();
        }
    }
}
// 启动时执行的初始化序列
async function initializeApp() {
    console.log(">>> Starting application initialization...");
    const dbConnected = await testConnection(); // 调用带重试的函数

    if (dbConnected) {
        console.log(">>> Database connection confirmed by testConnection. Proceeding with initializations.");
        await initFavoritesTable(); // 确保 initFavoritesTable 也有健壮的错误处理和连接释放
        console.log(">>> Attempting to call reinitializeOrderStatusColumn...");
        // await reinitializeOrderStatusColumn(); // 你已经注释掉了这个
        console.log(">>> Finished calling reinitializeOrderStatusColumn (check logs for success/failure).");

        // 启动 Express 服务器
        const PORT = process.env.PORT || 5200;
        app.listen(PORT, () => {
            console.log(`Backend on : ${PORT}`); // 移到这里，确保数据库连接成功后再监听
        });

    } else {
        console.error(">>> CRITICAL: Database connection failed after multiple retries. Cannot proceed with app initialization.");
        process.exit(1);
    }
    console.log(">>> Application initialization sequence finished.");
}

initializeApp();
// 启动时测试连接和初始化表
testConnection()
initFavoritesTable()
// 获取用户ID的辅助函数
async function getUserIdFromToken(authHeader) { // 将参数名改为 authHeader 更清晰
    console.log('>>> DEBUG: getUserIdFromToken 接收到的原始头:', authHeader); // 记录原始头
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('>>> DEBUG: getUserIdFromToken 无效的Authorization头');
        return null; // 如果不是 Bearer token 格式，直接返回 null
    }

    // 提取纯净的 token 字符串
    const token = authHeader.replace('Bearer ', '');
    console.log('>>> DEBUG: getUserIdFromToken 提取的纯净token:', token); // 记录提取后的 token

    if (!token) { // 提取后如果 token 为空，也返回 null
        console.log('>>> DEBUG: getUserIdFromToken 提取的token为空');
        return null;
    }

    try {
        // 使用纯净的 token 进行数据库查询
        const [rows] = await pool.execute('SELECT id FROM users WHERE token = ?', [token]);
        console.log('>>> DEBUG: getUserIdFromToken 查询结果:', rows); // 记录查询结果
        return rows.length > 0 ? rows[0].id : null;
    } catch (error) {
        console.error('>>> DEBUG: getUserIdFromToken 数据库查询出错:', error);
        return null; // 数据库错误时返回 null
    }
}
// 登录/注册接口
app.post('/login', async (req, res) => {
    const { account, password } = req.body;

    // // ❌ 极其危险的拼接方式，存在 SQL 注入风险-------------
    // const sql = `SELECT id, username, password FROM users WHERE username = '${account}' AND password = '${password}'`;

    if (!account || !password) {
        return res.status(400).json({ code: 1, message: '参数缺失' });
    }
    let connectionForDbCheck; 
    try {
        // 获取一个连接来检查当前数据库
        connectionForDbCheck = await pool.getConnection();
        const [currentDbResult] = await connectionForDbCheck.query('SELECT DATABASE() as current_database;');
        console.log('>>> DEBUG: /login - Current database for connection:', currentDbResult[0]?.current_database); // 打印当前数据库
        if (connectionForDbCheck) connectionForDbCheck.release(); // 释放连接

        // //危险----------------------
        // const [rows] = await pool.query(sql);
        // 查询用户，只根据用户名查找（不包括密码，安全起见）
        const [rows] = await pool.execute(
            'SELECT id, username, password, avatar_url FROM users WHERE username = ?',
            [account]
        );

        let user = rows[0];
        const token = nanoid(); // 始终生成新 token
        let finalAvatarUrl;
        let message = '';
        let userId;

        const saltRounds = 10; // 盐轮数，推荐 10-12，平衡安全和性能

        if (user) { // 用户存在 (登录逻辑)
            // 使用 bcrypt 比较哈希密码
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.json({ code: 2, message: '密码错误' });
            }
            message = '登录成功';
            userId = user.id;
            finalAvatarUrl = user.avatar_url;

            // 如果用户存在但没有头像，分配默认头像并更新数据库
            if (!finalAvatarUrl && defaultAvatars.length > 0) {
                finalAvatarUrl = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
                try {
                    await pool.execute(
                        'UPDATE users SET avatar_url = ?, token = ? WHERE id = ?',
                        [finalAvatarUrl, token, userId]
                    );
                } catch (dbError) {
                    console.error(`Failed to update avatar_url for existing user ${userId}:`, dbError);
                    await pool.execute('UPDATE users SET token = ? WHERE id = ?', [token, userId]); // 确保 token 更新
                }
            } else {
                // 仅更新 token
                await pool.execute('UPDATE users SET token = ? WHERE id = ?', [token, userId]);
            }
        } else { // 用户不存在 (注册逻辑)
            // 先哈希密码
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            message = '注册并登录成功';
            if (defaultAvatars.length > 0) {
                finalAvatarUrl = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
            } else {
                finalAvatarUrl = null;
            }

            // 插入新用户，存储哈希密码
            const [insertResult] = await pool.execute(
                'INSERT INTO users (username, password, token, avatar_url) VALUES (?, ?, ?, ?)',
                [account, hashedPassword, token, finalAvatarUrl] // 存储哈希密码
            );
            userId = insertResult.insertId;
            console.log(`New user ${account} (ID: ${userId}) registered with avatar: ${finalAvatarUrl}`);
        }

        // 统一返回用户信息
        res.json({
            code: 0,
            message: message,
            data: {
                token: token,
                userInfo: {
                    id: userId,
                    account: account,
                    avatar: finalAvatarUrl
                }
            }
        });

    } catch (error) {
        console.error('登录/注册过程出错:', error);
        res.status(500).json({ code: 500, message: '服务器错误' }); // 避免返回错误细节
    }
});

// 获取用户资料接口
app.get('/profile', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ code: 401, message: '未登录' });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT id, username, avatar_url FROM users WHERE token = ?',
            [token]
        );

        if (rows.length === 0) {
            return res.status(401).json({ code: 401, message: '未登录或Token无效' });
        }

        const user = rows[0];
        // 直接返回数据库中的 avatar_url。
        // 如果它在数据库中是 NULL (理论上经过新的登录逻辑后不应该了，除非是老数据且用户从未用新逻辑登录过)，
        // 那就返回 NULL，让前端处理。
        res.json({
            code: 0,
            data: {
                id: user.id, // 建议也返回 id
                account: user.username,
                avatar: user.avatar_url // 直接使用数据库的值
            }
        });
    } catch (error) {
        console.error('获取用户资料出错:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 获取用户收藏列表
app.get('/favorites', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
        return res.status(401).json({ code: 401, message: '未登录' })
    }

    try {
        // 获取用户ID
        const [userRows] = await pool.execute(
            'SELECT id FROM users WHERE token = ?',
            [token]
        )

        if (userRows.length === 0) {
            return res.status(401).json({ code: 401, message: '未登录' })
        }

        const userId = userRows[0].id

        // 获取用户收藏
        const [rows] = await pool.execute(
            'SELECT * FROM favorites WHERE user_id = ?',
            [userId]
        )

        // 格式化响应
        const favorites = rows.map(item => ({
            id: item.product_id,
            name: item.product_name,
            price: item.product_price,
            picture: item.product_picture
        }))

        res.json({ code: 0, message: '获取成功', data: favorites })
    } catch (error) {
        console.error('获取收藏列表出错:', error)
        res.status(500).json({ code: 500, message: '服务器错误' })
    }
})

// 添加收藏API修改
app.post('/favorites', async (req, res) => {
    const { id, name, price, picture } = req.body
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
        return res.status(401).json({ code: 401, message: '未登录' })
    }

    try {
        // 获取用户ID
        const [userRows] = await pool.execute(
            'SELECT id FROM users WHERE token = ?',
            [token]
        )

        if (userRows.length === 0) {
            return res.status(401).json({ code: 401, message: '未登录' })
        }

        const userId = userRows[0].id

        // 检查是否已收藏 - 使用字符串比较
        const [checkRows] = await pool.execute(
            'SELECT * FROM favorites WHERE user_id = ? AND product_id = ?',
            [userId, id.toString()] // 确保ID是字符串
        )

        if (checkRows.length > 0) {
            return res.json({ code: 0, message: '已收藏' })
        }

        // 添加收藏 - 存储原始ID字符串
        await pool.execute(
            'INSERT INTO favorites (user_id, product_id, product_name, product_price, product_picture) VALUES (?, ?, ?, ?, ?)',
            [userId, id.toString(), name, price, picture]
        )

        res.json({ code: 0, message: '收藏成功' })
    } catch (error) {
        console.error('收藏商品出错:', error)
        res.status(500).json({ code: 500, message: '服务器错误' })
    }
})

// 取消收藏
app.delete('/favorites/:id', async (req, res) => {
    const productId = req.params.id // 不转换类型
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
        return res.status(401).json({ code: 401, message: '未登录' })
    }

    try {
        // 获取用户ID
        const [userRows] = await pool.execute(
            'SELECT id FROM users WHERE token = ?',
            [token]
        )

        if (userRows.length === 0) {
            return res.status(401).json({ code: 401, message: '未登录' })
        }

        const userId = userRows[0].id

        // 删除收藏
        await pool.execute(
            'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        )

        res.json({ code: 0, message: '取消收藏成功' })
    } catch (error) {
        console.error('取消收藏出错:', error)
        res.status(500).json({ code: 500, message: '服务器错误' })
    }
})

//购物车接口

// 获取购物车列表
app.get('/cart', async (req, res) => {
    const authHeader = req.headers.authorization; // 获取完整的 Authorization 头
    const userId = await getUserIdFromToken(authHeader); // 将完整的头传给 getUserIdFromToken

    if (!userId) {
        return res.status(401).json({ code: 401, message: '未登录' });
    }

    try {
        const [rows] = await pool.execute(
            'SELECT product_id as id, product_name as name, product_price as price, product_picture as picture, quantity, selected FROM cart WHERE user_id = ?',
            [userId]
        );
        res.json({ code: 0, message: '获取购物车成功', data: rows });
    } catch (error) {
        console.error('获取购物车出错:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 添加商品到购物车 或 更新数量
app.post('/cart', async (req, res) => {
    const { id, name, price, picture, quantity = 1, selected = true } = req.body; // quantity和selected可以从前端传，也可以后端默认
    const authHeader = req.headers.authorization; // 获取完整的 Authorization 头
    const userId = await getUserIdFromToken(authHeader); // 将完整的头传给 getUserIdFromToken

    if (!userId) {
        return res.status(401).json({ code: 401, message: '未登录' });
    }

    if (!id || !name || price === undefined || picture === undefined) {
        return res.status(400).json({ code: 1, message: '参数缺失' });
    }

    try {
        // 检查商品是否已存在于购物车
        const [existingRows] = await pool.execute(
            'SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?',
            [userId, id]
        );

        if (existingRows.length > 0) {
            // 商品已存在，更新数量
            const existingItem = existingRows[0];
            const newQuantity = existingItem.quantity + quantity; // 假设是添加到现有数量
            await pool.execute(
                'UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newQuantity, existingItem.id]
            );
            res.json({ code: 0, message: '购物车商品数量更新成功' });
        } else {
            // 商品不存在，添加到购物车
            await pool.execute(
                'INSERT INTO cart (user_id, product_id, product_name, product_price, product_picture, quantity, selected) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, id, name, price, picture, quantity, selected]
            );
            res.json({ code: 0, message: '商品添加到购物车成功' });
        }
    } catch (error) {
        console.error('添加/更新购物车出错:', error);
        // 检查是否是UNIQUE KEY冲突错误
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ code: 409, message: '购物车已存在该商品' });
        } else {
            res.status(500).json({ code: 500, message: '服务器错误' });
        }
    }
});

// === 新增：批量更新购物车商品选中状态接口 ===
app.put('/cart/select-all', async (req, res) => {
    console.log('>>> DEBUG: Attempting to hit PUT /cart/select-all route <<<'); // <-- 确保这行在这里
    console.log('##################################################');
    console.log('### 后端成功匹配到 PUT /cart/select-all 路由 ###'); // <-- 确保这行在这里
    console.log('##################################################');
    console.log('请求体:', req.body);

    const { selected } = req.body; // 期望接收 { selected: true/false }
    const authHeader = req.headers.authorization; // 获取完整的 Authorization 头
    const userId = await getUserIdFromToken(authHeader); // 将完整的头传给 getUserIdFromToken

    if (!userId) {
        console.log('PUT /cart/select-all: 未登录');
        return res.status(401).json({ code: 401, message: '未登录' });
    }

    // 校验 selected 是否是布尔值
    if (typeof selected !== 'boolean') {
        console.log('PUT /cart/select-all: 参数错误，selected 必须是布尔值');
        return res.status(400).json({ code: 1, message: '参数错误，selected 必须是布尔值' });
    }

    try {
        console.log('PUT /cart/select-all: 准备执行数据库批量更新选中状态，用户ID:', userId, '选中状态:', selected);
        const [result] = await pool.execute(
            'UPDATE cart SET selected = ? WHERE user_id = ?',
            [selected, userId]
        );

        console.log(`PUT /cart/select-all: 成功更新 ${result.affectedRows} 件商品选中状态`);
        res.json({ code: 0, message: `成功更新 ${result.affectedRows} 件商品选中状态` });

    } catch (error) {
        console.error('批量更新购物车商品选中状态出错:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 更新购物车商品数量或选中状态
app.put('/cart/:productId', async (req, res) => {
    const productId = req.params.productId;
    const { quantity, selected } = req.body; // 可以只传quantity或selected
    const authHeader = req.headers.authorization; // 获取完整的 Authorization 头
    const userId = await getUserIdFromToken(authHeader); // 将完整的头传给 getUserIdFromToken

    if (!userId) {
        return res.status(401).json({ code: 401, message: '未登录' });
    }

    if (quantity === undefined && selected === undefined) {
        return res.status(400).json({ code: 1, message: '参数缺失' });
    }

    try {
        let query = 'UPDATE cart SET updated_at = CURRENT_TIMESTAMP';
        const params = [];

        if (quantity !== undefined) {
            query += ', quantity = ?';
            params.push(quantity);
        }
        if (selected !== undefined) {
            query += ', selected = ?';
            params.push(selected);
        }

        query += ' WHERE user_id = ? AND product_id = ?';
        params.push(userId, productId);

        const [result] = await pool.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 404, message: '购物车中未找到该商品' });
        }

        res.json({ code: 0, message: '购物车商品更新成功' });
    } catch (error) {
        console.error('更新购物车商品出错:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});



// === 新增：批量删除购物车商品接口 ===
app.delete('/cart/batch', async (req, res) => {
    console.log('##################################################');
    console.log('### 后端成功匹配到 DELETE /cart/batch 路由 ###');
    console.log('##################################################');
    console.log('请求体:', req.body);

    const { ids } = req.body;
    const authHeader = req.headers.authorization; // 获取完整的 Authorization 头
    const userId = await getUserIdFromToken(authHeader); // 将完整的头传给 getUserIdFromToken

    if (!userId) {
        console.log('DELETE /cart/batch: 未登录');
        return res.status(401).json({ code: 401, message: '未登录' });
    }

    // 校验 ids 是否是有效的非空数组
    if (!Array.isArray(ids) || ids.length === 0) {
        console.log('DELETE /cart/batch: 参数错误，ids 为空或非数组');
        return res.status(400).json({ code: 1, message: '参数错误，需要提供非空的商品ID数组' });
    }

    // 过滤有效的非空字符串ID
    const validIds = ids.filter(id => typeof id === 'string' && id.length > 0);

    if (validIds.length === 0) {
        console.log('DELETE /cart/batch: 参数错误，提供的商品ID无效或非字符串');
        return res.status(400).json({ code: 1, message: '参数错误，提供的商品ID无效' });
    }

    try {
        // === 修改这里：手动构建 IN 子句 ===
        // 使用 pool.escape() 安全地引用每个ID
        const idPlaceholders = validIds.map(id => pool.escape(id)).join(',');
        console.log('构建的 IN 子句部分:', idPlaceholders); // 添加日志查看构建的SQL片段

        const query = `DELETE FROM cart WHERE user_id = ? AND product_id IN (${idPlaceholders})`;
        const params = [userId]; // 只传递 userId 作为参数

        console.log('DELETE /cart/batch: 准备执行数据库删除，用户ID:', userId, '商品ID:', validIds);
        console.log('执行的SQL查询:', query); // 添加日志查看完整的SQL语句

        const [result] = await pool.execute(query, params); // 执行查询

        if (result.affectedRows === 0) {
            console.log('DELETE /cart/batch: 没有找到匹配的商品进行删除');
            res.json({ code: 0, message: '没有找到匹配的商品进行删除' });
        } else {
            console.log(`DELETE /cart/batch: 成功删除 ${result.affectedRows} 件商品`);
            res.json({ code: 0, message: `成功删除 ${result.affectedRows} 件商品` });
        }
    } catch (error) {
        console.error('批量删除购物车商品出错:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 删除购物车商品
app.delete('/cart/:productId', async (req, res) => {
    const productId = req.params.productId;
    const authHeader = req.headers.authorization; // 获取完整的 Authorization 头
    const userId = await getUserIdFromToken(authHeader); // 将完整的头传给 getUserIdFromToken

    if (!userId) {
        return res.status(401).json({ code: 401, message: '未登录' });
    }

    try {
        const [result] = await pool.execute(
            'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
            [userId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 404, message: '购物车中未找到该商品' });
        }

        res.json({ code: 0, message: '购物车商品删除成功' });
    } catch (error) {
        console.error('删除购物车商品出错:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});



// === 租赁订单接口 ===

// 获取用户租赁订单列表
app.get('/rentals', async (req, res) => {
    const authHeader = req.headers.authorization; // 获取完整的 Authorization 头
    const userId = await getUserIdFromToken(authHeader); // 将完整的头传给 getUserIdFromToken

    if (!userId) {
        return res.status(401).json({ code: 401, message: '未登录' });
    }

    try {
        // 根据用户ID查询租赁订单，并按创建时间倒序排列
        const [rows] = await pool.execute(
            'SELECT * FROM rental_orders WHERE user_id = ? ORDER BY createdAt DESC',
            [userId]
        );

        // 格式化日期字段为前端友好的格式 (例如 YYYY-MM-DD)
        const formattedRentals = rows.map(rental => ({
            ...rental,
            startDate: rental.startDate ? new Date(rental.startDate).toISOString().split('T')[0] : null,
            endDate: rental.endDate ? new Date(rental.endDate).toISOString().split('T')[0] : null,
            createdAt: rental.createdAt ? new Date(rental.createdAt).toLocaleString() : null, // 或者根据前端需要格式化
            returnDate: rental.returnDate ? new Date(rental.returnDate).toISOString().split('T')[0] : null,
        }));


        res.json({ code: 0, message: '获取租赁订单成功', data: formattedRentals });
    } catch (error) {
        console.error('获取租赁订单出错:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 创建新的租赁订单 (可能在商品详情页下单时调用)
// 这个接口不是myrental.vue直接需要的，但为了完整性可以加上
app.post('/rentals', async (req, res) => {
    // 假设请求体包含创建订单所需的所有信息
    const { productId, productName, productPicture, rentalPrice, deposit, days, startDate, endDate, rentalFee, totalAmount } = req.body;
    const authHeader = req.headers.authorization; // 获取完整的 Authorization 头
    const userId = await getUserIdFromToken(authHeader); // 将完整的头传给 getUserIdFromToken

    if (!userId) {
        return res.status(401).json({ code: 401, message: '未登录' });
    }

    // 简单的参数校验
    if (!productId || !productName || rentalPrice === undefined || deposit === undefined || !days || !startDate || !endDate || rentalFee === undefined || totalAmount === undefined) {
        return res.status(400).json({ code: 1, message: '参数缺失' });
    }

    try {
        const orderId = nanoid();
        const statusValue = '待发货'; // 确保这是你实际使用的字符串

        // 调试：打印 statusValue 的 Buffer 表示 (十六进制)
        console.log('>>> DEBUG: statusValue string:', statusValue);
        console.log('>>> DEBUG: statusValue buffer (hex):', Buffer.from(statusValue, 'utf8').toString('hex'));
        // 新增：打印 statusValue 的长度
        console.log('>>> DEBUG: statusValue string length:', statusValue.length);
        // 新增：打印 statusValue 每个字符的Unicode码点
        for (let i = 0; i < statusValue.length; i++) {
            console.log(`>>> DEBUG: char[${i}] '${statusValue[i]}' unicode: ${statusValue.charCodeAt(i).toString(16)}`);
        }


        await pool.execute(
            'INSERT INTO rental_orders (id, user_id, product_id, product_name, product_picture, rental_price, deposit, days, startDate, endDate, rentalFee, totalAmount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [orderId, userId, productId, productName, productPicture, rentalPrice, deposit, days, startDate, endDate, rentalFee, totalAmount, statusValue]
        );

        res.json({ code: 0, message: '租赁订单创建成功', data: { orderId } });
    } catch (error) {
        console.error('创建租赁订单出错:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});


// 取消租赁订单
app.put('/rentals/:orderId/cancel', async (req, res) => {
    const orderId = req.params.orderId;
    const authHeader = req.headers.authorization; // 获取完整的 Authorization 头
    const userId = await getUserIdFromToken(authHeader); // 将完整的头传给 getUserIdFromToken

    if (!userId) {
        return res.status(401).json({ code: 401, message: '未登录' });
    }

    try {
        // ... 前面的检查订单和状态的代码保持不变 ...
        const [orderRows] = await pool.execute(
            'SELECT status FROM rental_orders WHERE id = ? AND user_id = ?',
            [orderId, userId]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({ code: 404, message: '未找到该订单' });
        }

        const currentStatus = orderRows[0].status;

        if (currentStatus !== '待发货') {
            return res.status(400).json({ code: 1, message: `当前订单状态为 "${currentStatus}"，无法取消` });
        }

        // !!! 修改这里：移除 updated_at = CURRENT_TIMESTAMP !!!
        const [result] = await pool.execute(
            'UPDATE rental_orders SET status = ? WHERE id = ? AND user_id = ?',
            ['已取消', orderId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ code: 404, message: '未找到该订单或状态不允许取消' });
        }

        res.json({ code: 0, message: '订单已取消' });
    } catch (error) {
        console.error('>>> DEBUG: 取消租赁订单出错:', error); // <-- 后端会打印这个错误，检查后端终端！
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

// 删除租赁订单记录
app.delete('/rentals/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    const authHeader = req.headers.authorization; // 获取完整的 Authorization 头
    const userId = await getUserIdFromToken(authHeader); // 将完整的头传给 getUserIdFromToken

    if (!userId) {
        return res.status(401).json({ code: 401, message: '未登录' });
    }

    try {
        // 检查订单是否存在且属于当前用户，并且状态允许删除 (例如：已归还, 已取消)
        const [orderRows] = await pool.execute(
            'SELECT status FROM rental_orders WHERE id = ? AND user_id = ?',
            [orderId, userId]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({ code: 404, message: '未找到该订单' });
        }

        const currentStatus = orderRows[0].status;

        if (currentStatus !== '已归还' && currentStatus !== '已取消') {
            return res.status(400).json({ code: 1, message: `当前订单状态为 "${currentStatus}"，无法删除` });
        }


        const [result] = await pool.execute(
            'DELETE FROM rental_orders WHERE id = ? AND user_id = ?',
            [orderId, userId]
        );

        if (result.affectedRows === 0) {
            // 理论上上面已经检查过，这里是双重保险
            return res.status(404).json({ code: 404, message: '未找到该订单或状态不允许删除' });
        }

        res.json({ code: 0, message: '订单记录已删除' });
    } catch (error) {
        console.error('删除租赁订单记录出错:', error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

/**
 * @api {get} /products/:productId/comments 获取商品评论列表
 * @apiName GetProductComments
 * @apiGroup Comments
 *
 * @apiParam {Number} productId 商品的ID.
 *
 * @apiSuccess {Number} code 状态码 (0 表示成功).
 * @apiSuccess {String} message 提示信息.
 * @apiSuccess {Object[]} data 评论列表.
 * @apiSuccess {Number} data.id 评论ID.
 * @apiSuccess {String} data.content 评论内容.
 * @apiSuccess {Number} data.starRating 星级评分 (1-5).
 * @apiSuccess {String} data.createdAt 评论创建时间 (ISO 8601).
 * @apiSuccess {Object} data.user 评论用户信息.
 * @apiSuccess {Number} data.user.id 用户ID.
 * @apiSuccess {String} data.user.username 用户昵称.
 * @apiSuccess {String} data.user.avatarUrl 用户头像URL.
 */
app.get('/products/:productId/comments', async (req, res) => {
    const productIdParam = req.params.productId;
    const productId = parseInt(productIdParam, 10);

    if (isNaN(productId)) {
        return res.status(400).json({ code: 1, message: '无效的商品ID格式' });
    }

    try {
        const [commentsRows] = await pool.execute(
            `SELECT
                c.id, c.content, c.star_rating, c.created_at,
                u.id AS user_id, u.username, u.avatar_url
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.product_id = ?
            ORDER BY c.created_at DESC`,
            [productId]
        );

        const formattedComments = commentsRows.map(comment => {
            // 如果用户在 users 表中没有 avatar_url，则从预设列表中随机选择一个
            const avatar = comment.avatar_url || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
            return {
                id: comment.id,
                content: comment.content,
                starRating: comment.star_rating,
                createdAt: comment.created_at, // 前端Vue组件会格式化这个日期
                user: {
                    id: comment.user_id,
                    username: comment.username,
                    avatarUrl: avatar
                }
            };
        });

        res.json({ code: 0, message: '获取评论成功', data: formattedComments });

    } catch (error) {
        console.error(`获取商品 ${productId} 评论列表出错:`, error);
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

/**-----------------------------------------------------------------------
 * @api {post} /products/:productId/comments 发表新评论
 * @apiName PostProductComment
 * @apiGroup Comments
 *
 * @apiHeader {String} Authorization 用户认证Token (Bearer Token).
 * @apiParam {Number} productId 商品的ID.
 * @apiParam {String} content 评论内容.
 * @apiParam {Number} [starRating] 星级评分 (1-5, 可选).
 *
 * @apiSuccess {Number} code 状态码 (0 表示成功).
 * @apiSuccess {String} message 提示信息.
 * @apiSuccess {Object} data 新创建的评论对象 (结构同获取评论列表中的单个评论).
 */
app.post('/products/:productId/comments', async (req, res) => {
    const productIdParam = req.params.productId;
    const productId = parseInt(productIdParam, 10);

    const { content, starRating } = req.body;
const authHeader = req.headers.authorization; // 获取完整的 Authorization 头
const userId = await getUserIdFromToken(authHeader); // 将完整的头传给 getUserIdFromToken

    if (!userId) {
        return res.status(401).json({ code: 401, message: '未登录或Token无效' });
    }

    if (isNaN(productId)) {
        return res.status(400).json({ code: 1, message: '无效的商品ID格式' });
    }
    if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ code: 1, message: '评论内容不能为空' });
    }
    if (starRating !== undefined && (typeof starRating !== 'number' || starRating < 1 || starRating > 5)) {
        return res.status(400).json({ code: 1, message: '星级评分必须是1到5之间的数字' });
    }

    try {
        const [insertResult] = await pool.execute(
            'INSERT INTO comments (product_id, user_id, content, star_rating) VALUES (?, ?, ?, ?)',
            [productId, userId, content.trim(), starRating === undefined ? null : starRating]
        );

        const newCommentId = insertResult.insertId;

        // 获取刚插入的评论以及用户信息，用于返回给前端
        const [newCommentRows] = await pool.execute(
            `SELECT
                c.id, c.content, c.star_rating, c.created_at,
                u.id AS user_id, u.username, u.avatar_url
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?`,
            [newCommentId]
        );

        if (newCommentRows.length === 0) {
            console.error('新评论插入后未能查询到:', newCommentId);
            return res.status(500).json({ code: 500, message: '评论创建成功但查询失败' });
        }

        const createdComment = newCommentRows[0];
        const avatar = createdComment.avatar_url || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

        const formattedComment = {
            id: createdComment.id,
            content: createdComment.content,
            starRating: createdComment.star_rating,
            createdAt: createdComment.created_at,
            user: {
                id: createdComment.user_id,
                username: createdComment.username,
                avatarUrl: avatar
            }
        };

        res.status(201).json({ code: 0, message: '评论发表成功', data: formattedComment });

    } catch (error) {
        console.error(`为商品 ${productId} 发表评论出错:`, error);
        // 检查是否是外键约束失败 (例如 product_id 或 user_id 不存在)
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ code: 1, message: '关联的用户或商品不存在' });
        }
        res.status(500).json({ code: 500, message: '服务器错误' });
    }
});

app.delete('/comments/:commentId', async (req, res) => {
    const token = req.headers.authorization; // 从请求头获取 token
    const commentId = parseInt(req.params.commentId, 10);

    if (isNaN(commentId)) {
        return res.status(400).json({ code: 1, message: '无效的评论ID' });
    }

    // 1. 验证用户身份，获取当前登录用户的 ID
    const currentUserId = await getUserIdFromToken(token);
    if (!currentUserId) {
        return res.status(401).json({ code: 401, message: '未登录或Token无效' });
    }

    try {
        // 2. 查询要删除的评论，并获取其创建者 user_id
        const [commentRows] = await pool.execute(
            'SELECT user_id FROM comments WHERE id = ?',
            [commentId]
        );

        if (commentRows.length === 0) {
            return res.status(404).json({ code: 404, message: '评论不存在' });
        }

        const commentOwnerId = commentRows[0].user_id;

        // 3. 权限校验：判断当前登录用户是否是该评论的作者
        if (commentOwnerId !== currentUserId) {
            return res.status(403).json({ code: 403, message: '您无权删除此评论' });
        }

        // 4. 执行删除操作
        const [deleteResult] = await pool.execute(
            'DELETE FROM comments WHERE id = ?',
            [commentId]
        );

        if (deleteResult.affectedRows > 0) {
            res.json({ code: 0, message: '评论删除成功' });
        } else {
            // 理论上如果上面查到了评论，这里应该能删除
            // 除非在极短时间内评论被其他方式删除了
            res.status(404).json({ code: 404, message: '评论未找到或已被删除' });
        }

    } catch (error) {
        console.error('删除评论过程中出错:', error);
        res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
});

// 根路径

const PORT = process.env.PORT || 5200
app.listen(PORT, '0.0.0.0', () => console.log('Backend on :', PORT))
