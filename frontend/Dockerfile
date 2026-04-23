# Production Stage — usa dist-prod pre-compilado localmente (evita OOM en CI/VPS)
FROM nginx:alpine

# Healthcheck dependencies
RUN apk add --no-cache curl

# Copiar build pre-compilado
COPY dist-vps /usr/share/nginx/html

# Configuración custom de Nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
