FROM oven/bun:alpine
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --legacy-peer-deps

# Copy app code
COPY . .

# Generate Prisma client
RUN bunx prisma generate

# Set environment variables for large file handling
ENV NODE_OPTIONS="--max-old-space-size=4096"

EXPOSE 3000

# Start the app
CMD ["bun", "run", "index.ts"]