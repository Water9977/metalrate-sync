FROM node:20-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

# Full install (build needs vite/typescript from devDependencies) then prune
# afterward — omitting dev deps up front breaks `react-router build`.
RUN npm ci

COPY . .

RUN npm run build

RUN npm prune --omit=dev && npm cache clean --force

CMD ["npm", "run", "docker-start"]
