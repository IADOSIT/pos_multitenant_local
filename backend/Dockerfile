# Production Stage — usa dist pre-compilado localmente (evita OOM en VPS)
FROM node:20-alpine

RUN apk add --no-cache bash curl

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# dist viene pre-compilado desde el repo
COPY dist ./dist

ARG CACHE_BUST=0
RUN echo "Cache bust: $CACHE_BUST"

COPY uploads ./uploads-builtin
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/main"]
