FROM node:20-alpine
RUN apk add --no-cache openssl

# @react-router/serve defaults to 8080 when PORT isn't set (Railway sets
# PORT explicitly via a variable) -- this used to say 3000, which never
# matched what the app actually listened on.
EXPOSE 8080

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
