# Production Stage — usa dist pre-compilado localmente (evita OOM en VPS)
FROM node:20-alpine

RUN apk add --no-cache bash curl

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# CACHE_BUST debe ir ANTES de COPY dist para invalidar ese layer
ARG CACHE_BUST=0
RUN echo "Cache bust: $CACHE_BUST"

# dist viene pre-compilado desde el repo
COPY dist ./dist

COPY uploads ./uploads-builtin
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/main"]
