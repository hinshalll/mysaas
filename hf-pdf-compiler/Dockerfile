# Use official lightweight Node.js base image
FROM node:20-slim

# Install stable Chromium browser and standard Unicode fonts
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set standard environment variables for headless sandboxed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    CHROMIUM_PATH=/usr/bin/chromium \
    PORT=7860

# Set up working directory inside the container
WORKDIR /app

# Copy dependency mappings and install packages
COPY package.json ./
RUN npm install

# Copy application files
COPY server.js ./

# Expose Hugging Face Space port
EXPOSE 7860

# Launch Node application
CMD ["node", "server.js"]
