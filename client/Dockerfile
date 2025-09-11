# client

FROM node:18 AS build

WORKDIR /usr/src/app

COPY ./client/package*.json ./client/

COPY ./server/shared/ ./server/shared/

COPY ./client/ ./client/

WORKDIR /usr/src/app/client

RUN npm install 

RUN npm run build

EXPOSE 5173

CMD [ "npm", "run", "preview" ]
