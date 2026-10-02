# Production Stage — usa dist-prod pre-compilado localmente (evita OOM en CI/VPS)
FROM nginx:alpine

# Healthcheck dependencies
RUN apk add --no-cache curl

# CACHE_BUST debe ir ANTES de COPY dist-vps para invalidar ese layer.
# El docker-compose.yml ya le pasaba este argumento al frontend, pero aqui
# nunca se declaraba, asi que Docker lo ignoraba en silencio: la perilla
# existia en el compose y no hacia nada. En la practica salia bien porque
# COPY invalida su capa sola cuando cambia el contenido de dist-vps, pero
# entonces no habia forma de forzar una reconstruccion a proposito.
ARG CACHE_BUST=0

# Copiar build pre-compilado
COPY dist-vps /usr/share/nginx/html

# Configuración custom de Nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
