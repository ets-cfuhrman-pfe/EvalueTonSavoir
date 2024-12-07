# client

FROM node:18 AS build

WORKDIR /usr/src/app/client

COPY ./package*.json ./

COPY ./ .

RUN npm install

RUN npm run build

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:5173 || exit 1

CMD [ "npm", "run", "preview" ]