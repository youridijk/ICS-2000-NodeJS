# Credits to https://dev.to/karanpratapsingh/top-5-docker-best-practices-57oh

FROM node:19-alpine
WORKDIR /app

COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

CMD ["npm", "run", "start:server", "--", "--useEnv"]
