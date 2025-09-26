FROM oven/bun:alpine
WORKDIR /app

COPY . .

RUN bunx prisma generate

EXPOSE 3000

# Start the app
CMD ["bun", "run", "index.ts"]