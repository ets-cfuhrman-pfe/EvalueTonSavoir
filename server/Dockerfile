FROM node:18 AS backend

WORKDIR /usr/src/app/serveur

COPY ./package*.json ./

RUN npm install

COPY ./ .

EXPOSE 4400

CMD ["npm", "run", "start"]