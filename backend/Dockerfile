# backend/Dockerfile

# ---------- 安装依赖 ----------
FROM docker.m.daocloud.io/library/node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci            # 只装生产依赖
RUN echo ">>> DEBUG: Listing node_modules in deps stage after npm ci:" && ls -la node_modules && echo ">>> DEBUG: Checking for dotenv in deps stage:" && ls -la node_modules/dotenv || echo ">>> DEBUG: dotenv NOT found in deps stage"

# ---------- 生产镜像 ----------
FROM docker.m.daocloud.io/library/node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# 把依赖拷过来
COPY --from=deps /app/node_modules ./node_modules
RUN echo ">>> DEBUG: Listing node_modules in final stage after COPY:" && ls -la node_modules && echo ">>> DEBUG: Checking for dotenv in final stage:" && ls -la node_modules/dotenv || echo ">>> DEBUG: dotenv NOT found in final stage"

# 再把整个后端源码目录拷进来
COPY . .
RUN echo ">>> DEBUG: Listing files in /app after final COPY:" && ls -la

# 5200 = server.js 里 app.listen 用的端口
EXPOSE 5200
# 根据你的 docker-compose.yml，它会覆盖 CMD，但我们保留一个默认的
CMD ["node", "server.js"] 