# Use the Node base image
FROM node:18 as quizroom

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
EXPOSE 4500

# Start the server using the compiled JavaScript file
CMD ["node", "dist/app.js"]
