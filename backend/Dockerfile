# Stage 1: builder
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package.json
COPY tsconfig.base.json tsconfig.base.json
COPY backend/package.json backend/package.json
COPY web/package.json web/package.json

RUN npm install

COPY tsconfig.base.json tsconfig.base.json
COPY backend/ backend/

RUN npm run build --workspace backend

# Stage 2: runtime
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/backend/dist dist/
COPY --from=builder /app/node_modules node_modules/

EXPOSE 4000

CMD ["node", "dist/index.js"]
