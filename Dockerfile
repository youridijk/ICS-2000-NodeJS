# Credits to https://dev.to/karanpratapsingh/top-5-docker-best-practices-57oh

FROM node:24-alpine
WORKDIR /app

COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

CMD ["npm", "run", "start:server", "--", "--useEnv"]
