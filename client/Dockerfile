# client

FROM node:18 AS build

WORKDIR /usr/src/app/client

COPY ./package*.json ./

COPY ./ .

RUN npm install

RUN npm run build

ENV PORT=5173
EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT} || exit 1

CMD [ "npm", "run", "preview" ]