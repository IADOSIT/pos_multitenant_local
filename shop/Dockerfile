# Producción — usa .next/standalone pre-compilado localmente (evita OOM en VPS)
FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

# standalone viene pre-compilado desde el repo
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
