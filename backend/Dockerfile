# ---------- 安装依赖 ----------
FROM docker.m.daocloud.io/library/node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev            # 只装生产依赖

# ---------- 生产镜像 ----------
FROM docker.m.daocloud.io/library/node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# 把依赖拷过来
COPY --from=deps /app/node_modules ./node_modules
# 再把整个后端源码目录拷进来
COPY . .

# 5200 = server.js 里 app.listen 用的端口
EXPOSE 5200
CMD ["node", "server.js"]