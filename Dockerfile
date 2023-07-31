FROM node:18
ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "./"]
COPY ["yarn.lock", "./"]

RUN npm i
RUN npm install -g @nestjs/cli

COPY . .
RUN npm run build

EXPOSE 8000

CMD ["npm","run","start:prod"]