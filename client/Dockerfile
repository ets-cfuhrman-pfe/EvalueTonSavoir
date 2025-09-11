# client

# First stage: Copy server shared files
FROM node:18 AS server-files
WORKDIR /temp
COPY ./server/shared/ ./shared/

# Main build stage
FROM node:18 AS build

WORKDIR /usr/src/app

RUN ls -R /usr/src/app

COPY ./client/package*.json ./client/

# Copy shared files from the server-files stage
COPY --from=server-files /temp/shared/ ./server/shared/

COPY ./client/ ./client/

WORKDIR /usr/src/app/client

RUN npm install && npm run build

EXPOSE 5173

CMD [ "npm", "run", "preview" ]
