FROM node:18 AS backend

WORKDIR /usr/src/app/serveur

COPY ./package*.json ./

RUN npm install

COPY ./ .

EXPOSE 4400

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

CMD ["npm", "run", "start"]