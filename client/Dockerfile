# client

FROM node:18 AS build

WORKDIR /usr/src/app

# Copy server's shared folder first (needed for build)
COPY ./server/shared ./shared

# Set working directory to client
WORKDIR /usr/src/app/client

# Copy package files first for better caching
COPY ./client/package*.json ./

# Install dependencies (this layer will be cached if package.json doesn't change)
RUN npm install

# Copy client source code
COPY ./client/ .

# Build the application
ENV DOCKER_BUILD=true
RUN npm run build

EXPOSE 5173

CMD [ "npm", "run", "preview" ]