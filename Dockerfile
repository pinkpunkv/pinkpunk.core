FROM node:19-alpine AS builder

WORKDIR .

COPY package*.json ./

COPY ./src ./src
COPY ./prisma ./prisma
COPY ./tsconfig.json ./tsconfig.json
RUN npm install pnpm -g
RUN pnpm install
RUN pnpm run docker_build

FROM node:19-alpine

WORKDIR .

COPY package*.json ./
COPY --from=builder ./dist /dist
COPY --from=builder ./node_modules ./node_modules