# client

FROM node:18 AS build

WORKDIR /usr/src/app/client

COPY ./package*.json ./

COPY ./ .

RUN npm install

RUN npm run build

EXPOSE 5173

CMD [ "npm", "run", "preview" ]