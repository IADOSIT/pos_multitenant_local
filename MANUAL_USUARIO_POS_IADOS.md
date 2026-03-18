# MANUAL DE USUARIO
# POS-iaDoS — Sistema de Punto de Venta
### iaDoS · iados.mx · Monterrey, Nuevo León
**Contacto:** +52 81 1413 7902 | +52 83 1898 9580

---

## ÍNDICE

1. [Introducción](#introducción)
2. [Requisitos del Sistema](#requisitos)
3. [Instalación](#instalación)
4. [Primer Acceso](#primer-acceso)
5. [Módulo POS — Punto de Venta](#módulo-pos)
6. [Módulo Mesas](#módulo-mesas)
7. [Módulo Self Order — Pedido por QR](#módulo-self-order)
8. [Módulo Productos](#módulo-productos)
9. [Módulo Categorías](#módulo-categorías)
10. [Módulo Caja](#módulo-caja)
11. [Módulo Pedidos](#módulo-pedidos)
12. [Módulo Inventario](#módulo-inventario)
13. [Módulo Dashboard](#módulo-dashboard)
14. [Módulo Usuarios](#módulo-usuarios)
15. [Módulo Configuración](#módulo-configuración)
16. [Módulo Menú Digital](#módulo-menú-digital)
17. [Acceso por PIN](#acceso-por-pin)
18. [Roles y Permisos](#roles-y-permisos)
19. [Respaldo y Restauración](#respaldo)
20. [Preguntas Frecuentes](#faq)

---

## 1. INTRODUCCIÓN

**POS-iaDoS** es un sistema de Punto de Venta profesional desarrollado por **iaDoS**, empresa de tecnología con base en Monterrey, Nuevo León. Diseñado para restaurantes, fondas, cafeterías, tiendas y negocios de servicio rápido, combina tecnología de vanguardia con facilidad de uso.

### ¿Qué hace diferente a POS-iaDoS?

| Característica | POS-iaDoS | Sistemas tradicionales |
|---|---|---|
| Funciona sin internet | ✅ Sí (modo offline) | ❌ Requiere conexión |
| Self Order por QR | ✅ Incluido | 💲 Extra o no disponible |
| Menú digital en pantalla | ✅ Incluido | 💲 Extra |
| Multisucursal | ✅ Ilimitado | 💲 Por sucursal |
| Instalación en Windows | ✅ Un solo EXE | ❌ Requiere técnico |
| Soporte local Monterrey | ✅ Disponible | ❌ Solo en línea |
| Actualizaciones | ✅ Gratis | 💲 Membresía anual |

---

## 2. REQUISITOS DEL SISTEMA

### Modo Offline (EXE Instalador)
- **Sistema Operativo:** Windows 10 / Windows 11 (64 bits)
- **RAM:** Mínimo 4 GB (recomendado 8 GB)
- **Disco duro:** Mínimo 500 MB libres
- **Red local:** Para acceso desde otros dispositivos (tablets, celulares)
- **Navegador:** Chrome, Edge o Firefox (para acceder desde otros equipos)

### Modo en Nube (VPS)
- Cualquier dispositivo con navegador moderno
- Conexión a internet

---

## 3. INSTALACIÓN

### Instalación Rápida (Modo Offline)

1. Ejecutar `POS-iaDoS-Local-vX.X.X.exe` como **Administrador**
2. Seguir el asistente de instalación
3. Al finalizar, el sistema abre automáticamente en el navegador: `http://localhost:3000`
4. La instalación crea dos servicios de Windows que se inician automáticamente:
   - `PosIaDos-MariaDB` — Base de datos
   - `PosIaDos-Backend` — Servidor de la aplicación

### Archivos de gestión instalados en `C:\POS-iaDoS\`
- `INICIAR.bat` — Iniciar los servicios
- `DETENER.bat` — Detener los servicios
- `ESTADO.bat` — Ver estado actual
- `DESINSTALAR.bat` — Desinstalar el sistema

### Acceso desde otros equipos de la red
Una vez instalado, cualquier dispositivo en la misma red puede acceder usando la IP del servidor:
```
http://192.168.X.X:3000
```
*(Reemplaza con la IP real del equipo servidor)*

---

## 4. PRIMER ACCESO

### Credenciales iniciales

| Usuario | Email | Contraseña | PIN | Rol |
|---|---|---|---|---|
| Super Admin | admin@iados.mx | admin123 | 0000 | Superadmin |
| Administrador | admin2@iados.mx | admin123 | 1111 | Admin |
| Cajero | cajero@iados.mx | cajero123 | 1234 | Cajero |
| Mesero | mesero@iados.mx | cajero123 | 5678 | Mesero |

> ⚠️ **Importante:** Cambia las contraseñas en tu primer inicio de sesión desde **Configuración → Usuarios**.

### Pantalla de Login
- Ingresa tu correo y contraseña
- O usa el **acceso rápido por PIN** (ideal para pantallas touch)
- Marca "Recuérdame" para mantener la sesión activa

---

## 5. MÓDULO POS — PUNTO DE VENTA

El corazón del sistema. Desde aquí se gestionan todas las ventas del negocio.

### Acceso
Menú principal → **POS**

### Flujo de una venta completa

```
1. Abrir caja (si no está abierta)
        ↓
2. Seleccionar mesa o crear venta directa
        ↓
3. Agregar productos al carrito
        ↓
4. Confirmar pedido
        ↓
5. Seleccionar método de pago
        ↓
6. Imprimir ticket / Dar cambio
        ↓
7. Venta registrada en dashboard
```

### Funciones principales del POS

#### Carrito de compras
- Buscar producto por nombre, SKU o código de barras
- Agregar cantidad con botones + / -
- Aplicar descuento por producto
- Eliminar producto del carrito
- Ver total en tiempo real con impuestos desglosados

#### Métodos de pago
- **Efectivo** — Calcula cambio automáticamente con pad de billetes/monedas
- **Tarjeta** — Registra el monto cobrado por terminal
- **Transferencia** — Registra referencia del pago
- **Pago Mixto** — Combina dos o más métodos en una sola venta

#### Pad de denominaciones
Al seleccionar efectivo, aparece automáticamente el pad con denominaciones ($10, $20, $50, $100, $200, $500) para ingresar rápidamente el monto recibido y calcular el cambio exacto.

#### Descuentos
- Descuento por producto (porcentaje o monto fijo)
- Descuento global al ticket

#### Impresión de ticket
- Ticket automático al finalizar la venta
- Reimpresión desde módulo Pedidos
- Soporte para impresora térmica de 58mm y 80mm

---

## 6. MÓDULO MESAS

Gestión completa del salón del restaurante.

### Acceso
Menú principal → **Mesas**

### Funciones

#### Vista de mesas
- Mapa visual de todas las mesas del local
- Estado en tiempo real: Libre / Ocupada / Con pedido pendiente
- Color por mesero asignado (para identificar rápidamente quién atiende cada mesa)

#### Asignación de meseros
- Asignar un mesero responsable a cada mesa
- Visualización de carga de trabajo por mesero

#### Juntar mesas
- Unir dos mesas cuando un grupo grande lo requiera
- Separar mesas cuando el grupo se divide

#### QR de mesa para Self Order
- Generar e imprimir el código QR de cada mesa
- El QR contiene la URL del menú digital asociado a esa mesa
- Los clientes escanean y hacen su pedido desde su celular

#### Zonas
Organiza tus mesas por zonas: Terraza, Salón, Bar, Privado, etc.

---

## 7. MÓDULO SELF ORDER — PEDIDO POR QR

Sistema de autoservicio donde el cliente hace su pedido desde su propio celular escaneando un código QR en la mesa. **No requiere app adicional.**

### ¿Cómo funciona?

```
Cliente en la mesa
        ↓
Escanea QR con la cámara del celular
        ↓
Se abre el menú digital en el navegador del celular
        ↓
El cliente selecciona sus productos
        ↓
Ingresa su nombre y confirma el pedido
        ↓
El mesero recibe notificación en el POS
        ↓
Mesero confirma el pedido (lo manda a cocina)
        ↓
Al pagar, se envía encuesta de satisfacción
```

### Configuración inicial

1. Ir a **Mesas** → Seleccionar mesa → Ícono QR
2. Se genera una página imprimible con el QR, nombre de la empresa y número de mesa
3. Imprimir y colocar en cada mesa (plastificado recomendado)

> ⚠️ Para que el QR funcione desde celulares de clientes, el sistema debe accederse desde la **IP de red** del servidor (no desde `localhost`). Ej: `http://192.168.1.X:3000`

### Dashboard Self Order
Accede desde **Dashboard → pestaña Self Order** para ver:
- Total de pedidos por QR
- Ticket promedio
- Mesa más activa
- Tiempo promedio de confirmación
- Resultados de encuestas de satisfacción (calificación, comentarios)

### Encuesta de satisfacción post-pago
Al cobrar un pedido Self Order, se envía automáticamente una encuesta al cliente con:
- Calificación del servicio (1-5 estrellas)
- Calificación de la comida (1-5 estrellas)
- Campo de comentario libre

---

## 8. MÓDULO PRODUCTOS

Catálogo completo de productos/platillos del negocio.

### Acceso
Menú principal → **Productos**

### Gestión de productos

#### Campos de cada producto
| Campo | Descripción |
|---|---|
| SKU | Código único del producto |
| Nombre | Nombre en el menú/ticket |
| Descripción | Descripción para el menú digital |
| Precio | Precio de venta |
| Costo | Costo del insumo (para cálculo de margen) |
| Categoría | Clasificación del producto |
| Unidad | pza, kg, lt, etc. |
| Impuesto | Porcentaje de IVA aplicable |
| Código de barras | Para lectura con scanner |
| Controla stock | Si se descuenta inventario al vender |
| Imagen | Foto del producto para menú digital |
| Activo | Si aparece en el sistema |
| Disponible en POS | Si aparece en la pantalla de ventas |

#### Toggle "Disponible en POS"
Permite ocultar temporalmente un producto del POS sin eliminarlo (por ejemplo, un platillo que se acabó por el día).

#### Importación masiva por CSV
- Descargar plantilla desde **Productos → Importar → Descargar Plantilla**
- Llenar con tus productos en Excel y guardar como CSV
- Importar el archivo — se crean o actualizan productos automáticamente
- Compatible con CSV de Excel en español (delimitador punto y coma) y formato internacional (coma)

#### Búsqueda de imágenes
El sistema puede buscar imágenes del producto en internet automáticamente para asignarla al platillo.

---

## 9. MÓDULO CATEGORÍAS

Organiza tus productos por categorías para facilitar la navegación en el POS y el menú digital.

### Funciones
- Crear categorías con nombre, color e ícono
- Definir orden de aparición
- Imagen de portada para el menú digital
- Las categorías aparecen como pestañas en el POS para filtrar productos rápidamente

---

## 10. MÓDULO CAJA

Control completo del flujo de efectivo del negocio.

### Acceso
Menú principal → **Caja**

### Ciclo de caja

```
APERTURA DE CAJA
(fondo inicial en efectivo)
        ↓
VENTAS DEL DÍA
(se registran automáticamente)
        ↓
ENTRADAS / SALIDAS
(retiros, abonos manuales)
        ↓
CORTE DE CAJA
(conteo físico vs esperado)
        ↓
CIERRE Y REPORTE
```

### Funciones

#### Apertura
- Registra el fondo inicial en efectivo
- Anota quién abre la caja y a qué hora

#### Entradas y salidas manuales
- Registrar retiros (para pago de proveedores, gastos del día)
- Registrar entradas (cambio de billete, reposición de fondo)
- Cada movimiento queda registrado con fecha, hora y responsable

#### Corte de caja
- El sistema muestra el **total esperado** basado en ventas
- El cajero ingresa el **total real contado**
- Se calcula automáticamente la **diferencia** (sobrante o faltante)
- Se genera reporte de corte imprimible

#### Historial
- Ver todos los movimientos del día
- Filtrar por tipo: ventas, entradas, salidas
- Exportar para contabilidad

---

## 11. MÓDULO PEDIDOS

Historial completo de todas las transacciones realizadas.

### Funciones
- Ver todos los pedidos (activos, completados, cancelados)
- Filtrar por fecha, mesero, método de pago
- Ver detalle completo de cada pedido
- **Reimprimir ticket** de cualquier venta pasada
- Cancelar pedido (con control de permisos por rol)
- Estadísticas rápidas: total del día, número de ventas, ticket promedio

---

## 12. MÓDULO INVENTARIO

Control de stock para productos que requieren seguimiento de existencias.

### Funciones
- Ver stock actual de todos los productos con control de inventario
- Registrar ajustes de inventario (entrada de mercancía, merma, etc.)
- Alertas de stock mínimo
- El inventario se descuenta automáticamente al realizar ventas
- Historial de movimientos por producto

---

## 13. MÓDULO DASHBOARD

Centro de inteligencia del negocio con métricas en tiempo real.

### Acceso
Menú principal → **Dashboard**

### Pestañas disponibles

#### Ventas
- **Total del día / semana / mes** con comparativa vs período anterior
- **Gráfica de ventas** por hora (para identificar horas pico)
- **Ventas por método de pago** (efectivo, tarjeta, transferencia)
- **Top 10 productos más vendidos**
- **Ventas por categoría** (gráfica de pastel)
- **Ticket promedio**

#### Self Order
- KPIs de pedidos por QR
- Encuestas de satisfacción con promedio de calificación
- Rendimiento por mesero

### Filtros de fecha
- Hoy / Esta semana / Este mes / Rango personalizado

---

## 14. MÓDULO USUARIOS

Gestión del equipo de trabajo.

### Acceso
Menú principal → **Usuarios** (solo admins)

### Datos de cada usuario
- Nombre, email, contraseña
- Rol (ver sección Roles y Permisos)
- PIN de acceso rápido (4 dígitos)
- Empresa y tienda asignada
- Activo / Inactivo

### Cambio de contraseña
Cualquier usuario puede cambiar su propia contraseña desde su perfil.

---

## 15. MÓDULO CONFIGURACIÓN

Personalización completa del sistema.

### Acceso
Menú principal → **Configuración**

### Opciones disponibles

#### Empresa
- Nombre de la empresa
- Logo (aparece en tickets y menú digital)
- Dirección, teléfono, RFC
- Mensaje en el ticket (pie de página)

#### Tienda
- Nombre de la sucursal
- Configuración de impresora
- URL de acceso externo (para QR de Self Order)

#### Apariencia
- Tema oscuro / claro
- Color principal de la interfaz

#### Menú Digital
- Activar/desactivar menú digital
- Vista previa del menú
- **Publicar** — regenera el snapshot del menú con todas las fotos e info actualizada

---

## 16. MÓDULO MENÚ DIGITAL

Versión pública del catálogo de productos para clientes.

### Funciones
- Vista atractiva del menú con fotos de los platillos
- Filtro por categorías
- Descripción completa y precio de cada producto
- Actualización instantánea al publicar cambios
- Accesible desde cualquier dispositivo sin necesidad de cuenta

### Pantalla de TV/Lobby
El menú digital puede mostrarse en una pantalla de TV en el local para que los clientes vean los platillos disponibles mientras esperan.

---

## 17. ACCESO POR PIN

Diseñado para pantallas táctiles en el mostrador.

### Cómo funciona
1. En la pantalla de login, seleccionar **"Acceso con PIN"**
2. Aparece un teclado numérico en pantalla
3. Ingresar el PIN de 4 dígitos
4. Acceso inmediato sin necesidad de teclado físico

### Ventajas
- Ideal para tabletas y pantallas touch en caja
- Acceso en menos de 3 segundos
- Cambio rápido de operador sin cerrar sesión completa
- Siempre disponible la opción de login con email/contraseña como alternativa

---

## 18. ROLES Y PERMISOS

| Función | Superadmin | Admin | Manager | Cajero | Mesero |
|---|:---:|:---:|:---:|:---:|:---:|
| Ver todos los tenants | ✅ | ❌ | ❌ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gestionar productos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Abrir/cerrar caja | ✅ | ✅ | ✅ | ✅ | ❌ |
| Realizar ventas | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver dashboard | ✅ | ✅ | ✅ | ❌ | ❌ |
| Cancelar pedidos | ✅ | ✅ | ✅ | ❌ | ❌ |
| Configuración sistema | ✅ | ✅ | ❌ | ❌ | ❌ |
| Gestionar mesas | ✅ | ✅ | ✅ | ✅ | ✅ |
| Confirmar pedidos QR | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 19. RESPALDO Y RESTAURACIÓN

### Respaldo automático
El sistema guarda los datos en la base de datos local automáticamente.

### Respaldo manual
- Ir a **Configuración → Respaldo**
- Descargar el archivo `.sql` con todos los datos
- Guardar en un lugar seguro (USB, nube, email)

### Restauración
- En caso de reinstalación, importar el archivo de respaldo
- Los datos se restauran completamente incluyendo ventas, productos y configuración

---

## 20. PREGUNTAS FRECUENTES

**¿Funciona sin internet?**
Sí. El modo offline (instalador EXE) funciona completamente sin conexión a internet. La base de datos y el servidor están instalados en el mismo equipo.

**¿Puedo usar el sistema desde mi celular o tablet?**
Sí. Desde cualquier dispositivo en la misma red Wi-Fi accediendo por la IP del servidor: `http://IP-SERVIDOR:3000`

**¿Cuántos usuarios puedo tener?**
Ilimitados. No hay costo adicional por número de usuarios.

**¿Puedo tener varias sucursales?**
Sí. El sistema es multisucursal y multi-empresa desde un mismo servidor.

**¿Qué pasa si se va la luz?**
Los datos de la sesión actual se mantienen en el navegador. Al restaurar la energía, el sistema reinicia automáticamente y los datos guardados están intactos.

**¿El sistema funciona en Mac o Linux?**
El instalador EXE es exclusivo para Windows. Sin embargo, el acceso desde navegador funciona en cualquier sistema operativo (Mac, Linux, iOS, Android).

**¿Puedo importar mi catálogo de productos desde Excel?**
Sí. El sistema acepta archivos CSV exportados desde Excel con los campos: SKU, nombre, precio, costo, categoría, etc.

**¿Tiene soporte para facturación electrónica (CFDI)?**
Actualmente el sistema genera tickets de venta. La integración con CFDI está disponible como módulo adicional. Consulta a tu asesor iaDoS.

---

## SOPORTE TÉCNICO

¿Necesitas ayuda? Contáctanos:

| Canal | Información |
|---|---|
| WhatsApp | +52 81 1413 7902 |
| WhatsApp | +52 83 1898 9580 |
| Sitio web | www.iados.mx |
| Ubicación | Monterrey, Nuevo León, México |
| Horario | Lunes a Viernes 9:00 - 18:00 |

---

*POS-iaDoS v2.2 · iaDoS © 2025 · Todos los derechos reservados*
*Desarrollado con tecnología de vanguardia en Monterrey, Nuevo León*
