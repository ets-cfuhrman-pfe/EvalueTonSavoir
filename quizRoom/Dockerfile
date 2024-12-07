# Use the Node base image 
FROM node:18 AS quizroom

ENV PORT=4500
ENV ROOM_ID=000000

# Create a working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available) and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code to the container
COPY . .

# Ensure healthcheck.sh has execution permissions
COPY healthcheck.sh /usr/src/app/healthcheck.sh
RUN chmod +x /usr/src/app/healthcheck.sh

# Build the TypeScript code
RUN npm run build

# Expose WebSocket server port
EXPOSE ${PORT}

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
  CMD /usr/src/app/healthcheck.sh

# Start the server using the compiled JavaScript file
CMD ["node", "dist/app.js"]