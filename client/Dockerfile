# client

FROM node:18 AS build

WORKDIR /usr/src/app/client

# Copy package.json from client directory
COPY ./client/package*.json ./

# Copy the shared validation constants from server
COPY ./server/shared ./shared

# Copy the rest of the client files
COPY ./client/ .

RUN npm install

RUN npm run build

EXPOSE 5173

CMD [ "npm", "run", "preview" ]
