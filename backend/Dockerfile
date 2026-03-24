FROM node:22-alpine

WORKDIR /app

COPY package.json package.json
COPY tsconfig.base.json tsconfig.base.json
COPY backend/package.json backend/package.json
COPY web/package.json web/package.json

RUN npm install

COPY . .

EXPOSE 4000

CMD ["npm", "run", "start", "--workspace", "backend"]

