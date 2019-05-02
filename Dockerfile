FROM node:10.12.5

COPY . /starter
COPY package.json /starter/package.json
COPY .env /starter/.env

WORKDIR /starter

RUN npm install

RUN npm audit fix

CMD ["npm","start"]

EXPOSE 8888
