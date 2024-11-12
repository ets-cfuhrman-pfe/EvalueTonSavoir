# Use the Node base image
FROM node:18 AS quizroom

ARG PORT=4500
ENV PORT=${PORT}
ENV ROOM_ID=${ROOM_ID}

# Create a working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available) and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code to the container
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose WebSocket server port
EXPOSE ${PORT}

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
  CMD /usr/src/app/healthcheck.sh

# Start the server using the compiled JavaScript file
CMD ["node", "dist/app.js"]
