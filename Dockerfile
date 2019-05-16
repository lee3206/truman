FROM node:10

COPY . /starter
COPY package.json /starter/package.json
COPY .env /starter/.env

WORKDIR /starter

RUN npm install 

RUN npm audit fix

CMD ["npm","start"]

EXPOSE 8888