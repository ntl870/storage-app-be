FROM node:alpine
ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "./"]
COPY ["yarn.lock", "./"]

RUN yarn
RUN npm install -g @nestjs/cli

COPY . .
RUN npm run build


EXPOSE 8000

CMD ["yarn","start:prod"]