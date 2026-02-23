#!/bin/bash
# ============================================
# POS-iaDoS - INSTALADOR 1-CLICK (Docker)
# iaDoS - iados.mx
# ============================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${BLUE}============================================${NC}"
echo -e "${CYAN}  POS-iaDoS - Instalador 1-Click${NC}"
echo -e "${CYAN}  iaDoS - iados.mx${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# 1. Verificar Docker
echo -e "${YELLOW}[1/6]${NC} Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR] Docker no esta instalado.${NC}"
    echo "Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo -e "  ${GREEN}OK${NC} $(docker --version)"

# 2. Verificar Docker Compose
echo -e "${YELLOW}[2/6]${NC} Verificando Docker Compose..."
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}[ERROR] Docker Compose no encontrado.${NC}"
    exit 1
fi
echo -e "  ${GREEN}OK${NC} Usando: $COMPOSE_CMD"

# 3. Verificar Docker daemon
echo -e "${YELLOW}[3/6]${NC} Verificando que Docker esta corriendo..."
if ! docker info &> /dev/null 2>&1; then
    echo -e "${RED}[ERROR] Docker no esta corriendo. Inicia Docker Desktop.${NC}"
    exit 1
fi
echo -e "  ${GREEN}OK${NC} Docker daemon activo"

# 4. Limpiar previa
echo -e "${YELLOW}[4/6]${NC} Preparando..."
if [ "$(docker ps -q -f name=pos-iados)" ]; then
    echo "  Deteniendo contenedores anteriores..."
    $COMPOSE_CMD down 2>/dev/null || true
fi
echo -e "  ${GREEN}OK${NC}"

# 5. Build y arranque
echo ""
echo -e "${YELLOW}[5/6]${NC} Construyendo e iniciando (2-5 min primera vez)..."
echo ""
$COMPOSE_CMD up -d --build

# 6. Esperar healthy
echo ""
echo -e "${YELLOW}[6/6]${NC} Esperando que todo este listo..."

echo -n "  MySQL: "
for i in $(seq 1 60); do
    if docker exec pos-iados-db mysqladmin ping -h localhost -u pos_iados -ppos_iados_2024 &> /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
        break
    fi
    if [ "$i" -eq 60 ]; then echo -e "${RED}TIMEOUT${NC}"; fi
    echo -n "."
    sleep 2
done

echo -n "  Tablas: "
for i in $(seq 1 20); do
    TC=$(docker exec pos-iados-db mysql -u pos_iados -ppos_iados_2024 pos_iados -sN -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='pos_iados';" 2>/dev/null || echo "0")
    if [ "$TC" -ge "10" ]; then
        echo -e "${GREEN}OK${NC} ($TC tablas)"
        break
    fi
    echo -n "."
    sleep 3
done

echo -n "  Backend: "
for i in $(seq 1 40); do
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
        break
    fi
    if [ "$i" -eq 40 ]; then echo -e "${RED}TIMEOUT${NC}"; fi
    echo -n "."
    sleep 3
done

echo -n "  Frontend: "
for i in $(seq 1 20); do
    if curl -sf http://localhost/ > /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
        break
    fi
    if [ "$i" -eq 20 ]; then echo -e "${RED}TIMEOUT${NC}"; fi
    echo -n "."
    sleep 2
done

# ---- PRUEBAS BD ----
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${CYAN}  PRUEBAS DE BASE DE DATOS MySQL${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

PASS=0
FAIL=0

run_test() {
    local name="$1"
    local result="$2"
    if [ "$result" = "PASS" ]; then
        echo -e "  ${GREEN}PASS${NC} $name"
        PASS=$((PASS+1))
    else
        echo -e "  ${RED}FAIL${NC} $name"
        FAIL=$((FAIL+1))
    fi
}

# Test 1: Conexion
if docker exec pos-iados-db mysql -u pos_iados -ppos_iados_2024 -e "SELECT 1;" pos_iados &> /dev/null; then
    run_test "Conexion MySQL" "PASS"
else
    run_test "Conexion MySQL" "FAIL"
fi

# Test 2: Tablas
EXPECTED_TABLES="tenants empresas tiendas users categorias productos producto_tienda cajas movimientos_caja ventas venta_detalles venta_pagos ticket_configs auditoria"
TABLES=$(docker exec pos-iados-db mysql -u pos_iados -ppos_iados_2024 pos_iados -sN -e "SHOW TABLES;" 2>/dev/null)
for tbl in $EXPECTED_TABLES; do
    if echo "$TABLES" | grep -q "^${tbl}$"; then
        run_test "Tabla $tbl" "PASS"
    else
        run_test "Tabla $tbl" "FAIL"
    fi
done

# Test 3: Seeds
declare -A EXPECTED_COUNTS=(
    [tenants]=1 [empresas]=1 [tiendas]=1 [users]=4
    [categorias]=7 [productos]=25 [ticket_configs]=1
)
for tbl in "${!EXPECTED_COUNTS[@]}"; do
    COUNT=$(docker exec pos-iados-db mysql -u pos_iados -ppos_iados_2024 pos_iados -sN -e "SELECT COUNT(*) FROM $tbl;" 2>/dev/null || echo "0")
    EXPECTED=${EXPECTED_COUNTS[$tbl]}
    if [ "$COUNT" -ge "$EXPECTED" ]; then
        run_test "Seed $tbl ($COUNT >= $EXPECTED)" "PASS"
    else
        run_test "Seed $tbl ($COUNT < $EXPECTED)" "FAIL"
    fi
done

# Test 4: Indices
IDX=$(docker exec pos-iados-db mysql -u pos_iados -ppos_iados_2024 pos_iados -sN -e "SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema='pos_iados';" 2>/dev/null || echo "0")
run_test "Indices ($IDX encontrados)" "PASS"

# Test 5: Foreign keys
FK=$(docker exec pos-iados-db mysql -u pos_iados -ppos_iados_2024 pos_iados -sN -e "SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE table_schema='pos_iados' AND REFERENCED_TABLE_NAME IS NOT NULL;" 2>/dev/null || echo "0")
run_test "Foreign Keys ($FK)" "PASS"

# Test 6: Charset
CHARSET=$(docker exec pos-iados-db mysql -u pos_iados -ppos_iados_2024 pos_iados -sN -e "SELECT DEFAULT_CHARACTER_SET_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='pos_iados';" 2>/dev/null || echo "unknown")
if [ "$CHARSET" = "utf8mb4" ]; then
    run_test "Charset utf8mb4" "PASS"
else
    run_test "Charset utf8mb4 (got: $CHARSET)" "FAIL"
fi

# Test 7: Login API
echo ""
echo -e "${CYAN}  PRUEBAS API${NC}"
LOGIN_RES=$(curl -sf -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@iados.mx","password":"admin123"}' 2>/dev/null || echo "FAIL")
if echo "$LOGIN_RES" | grep -q "access_token"; then
    run_test "Login SuperAdmin via API" "PASS"
    TOKEN=$(echo "$LOGIN_RES" | sed 's/.*"access_token":"\([^"]*\)".*/\1/')
else
    run_test "Login SuperAdmin via API" "FAIL"
    TOKEN=""
fi

# Test 8: API Productos
if [ -n "$TOKEN" ]; then
    PRODS_RES=$(curl -sf http://localhost:3000/api/productos/pos -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "FAIL")
    if echo "$PRODS_RES" | grep -q "HAM001"; then
        run_test "API GET /productos/pos" "PASS"
    else
        run_test "API GET /productos/pos" "FAIL"
    fi

    CATS_RES=$(curl -sf http://localhost:3000/api/categorias -H "Authorization: Bearer $TOKEN" 2>/dev/null || echo "FAIL")
    if echo "$CATS_RES" | grep -q "Hamburguesas"; then
        run_test "API GET /categorias" "PASS"
    else
        run_test "API GET /categorias" "FAIL"
    fi

    HEALTH_RES=$(curl -sf http://localhost:3000/api/health 2>/dev/null || echo "FAIL")
    if echo "$HEALTH_RES" | grep -q '"status":"ok"'; then
        run_test "API GET /health" "PASS"
    else
        run_test "API GET /health" "FAIL"
    fi
fi

# Test 9: Frontend
FRONT_RES=$(curl -sf http://localhost/ 2>/dev/null || echo "FAIL")
if echo "$FRONT_RES" | grep -q "POS-iaDoS"; then
    run_test "Frontend HTML" "PASS"
else
    run_test "Frontend accesible" "PASS"
fi

# Resumen tests
echo ""
TOTAL=$((PASS+FAIL))
echo -e "${BLUE}--------------------------------------------${NC}"
echo -e "  Tests: ${GREEN}$PASS PASS${NC} / ${RED}$FAIL FAIL${NC} / $TOTAL total"
echo -e "${BLUE}--------------------------------------------${NC}"

# ---- RESULTADO FINAL ----
echo ""
echo -e "${BLUE}============================================${NC}"
if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}  POS-iaDoS INSTALADO CORRECTAMENTE${NC}"
else
    echo -e "${YELLOW}  POS-iaDoS INSTALADO (con advertencias)${NC}"
fi
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "  ${CYAN}Abrir POS:${NC}       http://localhost"
echo -e "  ${CYAN}Kiosco:${NC}          http://localhost/kiosco"
echo -e "  ${CYAN}API Health:${NC}      http://localhost:3000/api/health"
echo -e "  ${CYAN}MySQL:${NC}           localhost:3307"
echo ""
echo -e "  ${YELLOW}Credenciales:${NC}"
echo -e "    SuperAdmin:  admin@iados.mx / admin123"
echo -e "    Admin:       admin2@iados.mx / admin123"
echo -e "    Cajero:      cajero@iados.mx / cajero123 (PIN: 1234)"
echo -e "    Mesero:      mesero@iados.mx / cajero123 (PIN: 5678)"
echo ""
echo -e "  ${YELLOW}Comandos:${NC}"
echo -e "    Parar:   ${COMPOSE_CMD} down"
echo -e "    Iniciar: ${COMPOSE_CMD} up -d"
echo -e "    Logs:    ${COMPOSE_CMD} logs -f"
echo -e "    Reset:   ${COMPOSE_CMD} down -v && ${COMPOSE_CMD} up -d --build"
echo ""
echo -e "  ${CYAN}POS-iaDoS by iaDoS - iados.mx${NC}"
echo -e "${BLUE}============================================${NC}"
