# ============ 构建阶段 ============
FROM docker.m.daocloud.io/library/node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci                       
COPY . .
USER root  
# Windows / 部分 git 客户端会丢掉可执行位，先补回来
RUN chmod -R +x node_modules/.bin && npm run build

# ============ 运行阶段 ============
FROM docker.io/library/nginx:1.25-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/
EXPOSE 80                        
CMD ["nginx", "-g", "daemon off;"]