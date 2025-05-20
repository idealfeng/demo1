# Vue3-SICAU 全栈示例

一套「Vue3 + Pinia + Vite」前端 ＆ 「Node.js + Express + MySQL」后端的完整示例。  
支持用户注册 / 登录、商品列表、收藏、评论等功能，既可本地热更新，也可一键 Docker 部署。

## 目录结构
​
vue3_sicau/
│
├─ .gitignore
├─ README.md
├─ package-lock.json
├─ nodemon.json
├─ jsconfig.json
├─ docker-compose.yml          # 三服务编排：db / backend / frontend
├─ .env.sample                 # 根环境变量模板 → cp 为 .env
│   └─(MYSQL_ROOT_PASSWORD / MYSQL_PORT / BACKEND_PORT / FRONTEND_PORT)
├─db/ init.sql                # 首次建表脚本（容器 entrypoint 调用）
├─ backend/
│   ├─ Dockerfile               # 构建 backend 镜像
│   ├─ server.js                 # 入口
│   ├─ models/                 # Sequelize / mysql2
│   ├─ users.json                # 若有本地 mock
│   ├─ jiaoben.js                # 其他脚本
│   ├─ package.json            
│   ├─ package-lock.json
│   ├─ .env.example             # PORT / DB_* → cp 成 .env
│   └─ node_modules/ (git 忽略)
│
└─ frontend/
    ├─ Dockerfile                 # 构建生产静态站镜像
    ├─ vite.config.js          	  # 含 dev 代理：/api → http://localhost:5200
    ├─ package.json
├─ package-lock.json
├─ nginx.conf                # 给 frontend 容器里的 nginx 用
├─ public/					  #公共资源（如图标）
├─ index.html               
    ├─ src/
    │   ├─ api/				  # Axios 封装接口请求
    │   ├─ assets/				  # 静态资源（图片/图标）
    │   ├─ components/		  # 通用组件（如商品卡片、轮播图）
    │   ├─ composables/		  # Vue组合式函数（如useUser、useCart）
    │   ├─ directives/			  # 自定义指令（如懒加载、权限）
    │   ├─ router/				  # Vue Router 配置
    │   ├─ stores/				  # Pinia 状态管理（用户/购物车等）
    │   ├─ styles/				  # 全局样式（SCSS）
    │   ├─ utils/				  # 工具方法（如http、校验函数）
    │   ├─ views/				  # 页面组件（如首页、商品页、订单页）
    │   ├─ App.vue
    │   └─ main.js
  
    └─ node_modules/ (git 忽略)



---

## 环境准备

| 软件           | 版本建议 |
| -------------- | -------- |
| Node.js        | ≥ 18     |
| npm / pnpm     | ≥ 9      |
| Docker         | ≥ 24     |
| Docker Compose | v2       |
| Git            | 任意     |

---

## 一、仅本地热更新开发（不进容器）

> 先把数据库放在 Docker，前后端在宿主机热更新，体验最好。

```bash
# 1. 只启数据库
docker compose up -d db

# 2. 本地后端
cd backend
cp .env.example .env         # 配置 DB_HOST=host.docker.internal 等
npm i
npm run dev                  # http://localhost:5200

# 3. 本地前端
cd ../frontend
cp .env.development.example .env.development
npm i
npm run dev -- --port 5175   # http://localhost:5175
​
Vite 已在 vite.config.js 把 /api 代理到 localhost:5200，前后端即可联调。

二、全容器一把梭
# 0. 克隆并进入项目
git clone https://github.com/idealfeng/vue3_sicau.git
cd vue3_sicau

# 1. 初始化环境变量
cp .env.sample .env
cp backend/.env.example backend/.env
cp frontend/.env.development.example frontend/.env.development

# 2. 构建并启动三个服务
docker compose up -d --build

# 3. 访问
#   前端  : http://localhost:5173
#   后端  : http://localhost:15200/api/health  →  {"status":"ok"}
#   MySQL : 127.0.0.1:13306  (root / ${MYSQL_ROOT_PASSWORD})
​
端口一览
角色	    容器端口	宿主端口（默认）
MySQL	    3306	    13306
Backend	    5200	    15200
Frontend	80	        5173
可修改 .env 里的 *_PORT 后 docker compose up -d.

三、健康自检脚本
仓库根提供 check.sh（Windows 用户用 PowerShell 同理）：

#!/usr/bin/env bash
source .env
echo "→ 容器状态"; docker compose ps
echo "→ MySQL ping"; docker exec vue3_sicau-db-1 mysqladmin ping -uroot -p${MYSQL_ROOT_PASSWORD} --silent && echo OK
echo "→ Backend"; curl -fs http://localhost:${BACKEND_PORT:-15200}/api/health && echo
echo "→ Frontend"; curl -I -s http://localhost:${FRONTEND_PORT:-5173} | head -n1
​
chmod +x check.sh
./check.sh
​
全部 OK 即容器化成功。

四、核心 Nginx 配置 (frontend/nginx.conf)
server {
    listen 80;
    root /usr/share/nginx/html;
    location / { try_files $uri $uri/ /index.html; }
    location /api/ { proxy_pass http://backend:5200; }
}
​
五、常用脚本
# 仅重启后端
docker compose restart backend

# 更新代码后重建镜像
docker compose build backend frontend
docker compose up -d
