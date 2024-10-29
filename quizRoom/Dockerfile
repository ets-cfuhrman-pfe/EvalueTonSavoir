# Use the Node base image
FROM node:18

# Create a working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code to the container
COPY . .

# Expose WebSocket server port
EXPOSE 4500

# Start the WebSocket server
CMD ["node", "app.js"]
