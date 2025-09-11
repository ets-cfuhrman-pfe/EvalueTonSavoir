# client

FROM node:18 AS debug

WORKDIR /usr/src/app

# Debug: Show what's available in the build context
RUN echo "=== Build context root ===" && ls -la

COPY ./client/package*.json ./client/

# Debug: Check if server directory exists before copying
RUN echo "=== Checking for server directory ===" && \
    if [ -d "./server" ]; then \
        echo "server directory exists:" && ls -la ./server/; \
        if [ -d "./server/shared" ]; then \
            echo "server/shared directory exists:" && ls -la ./server/shared/; \
        else \
            echo "server/shared directory does NOT exist!"; \
        fi \
    else \
        echo "server directory does NOT exist!"; \
        echo "Available directories:"; \
        find . -type d -maxdepth 2; \
    fi

COPY ./server/shared/ ./server/shared/

# Debug: Verify the copy worked
RUN echo "=== After copying server/shared ===" && \
    ls -la ./server/shared/ && \
    echo "=== Full directory structure ===" && \
    find . -type d | head -10

COPY ./client/ ./client/

WORKDIR /usr/src/app/client

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
