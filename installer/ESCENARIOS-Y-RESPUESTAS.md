# Mariscos23 — todos los escenarios y como los resuelve el EXE

**Paquete:** `POS-iaDoS-Local-v2.4.4.exe` · modo `local` (MariaDB propia) · destino **Windows 11 Pro**

**Regla de oro de todo el documento:** nunca se borra data del cliente, y siempre se puede volver atras.

Este archivo recorre de inicio a fin lo que puede salir mal, en el orden en que puede pasar, y dice **donde** esta resuelto. Al final hay una seccion de lo que **NO** queda resuelto, sin adornos.

---

## A. Antes de que el EXE llegue a correr

| # | Escenario | Como queda resuelto |
|---|---|---|
| A1 | **SmartScreen** bloquea el EXE porque no esta firmado | No se puede evitar sin certificado. Camino exacto: *Mas informacion* → *Ejecutar de todas formas*. Ver seccion G. |
| A2 | Windows pide **UAC** | `PrivilegesRequired=admin` en `setup.iss`: pide elevacion una sola vez, al inicio. Nunca a media instalacion. |
| A3 | Equipo de **32 bits** | `ArchitecturesInstallIn64BitMode=x64` y, dentro, PASO 0 aborta antes de copiar nada. La MariaDB empaquetada es x64. |
| A4 | **Antivirus o Carpetas Controladas** no dejan escribir en `C:\POS-iaDoS` | PASO 0 hace una **escritura de prueba real** (crea y borra un archivo). Si falla, aborta con el mensaje que nombra Acceso Controlado a Carpetas. No deja nada a medias. |
| A5 | **Disco lleno** | PASO 0: menos de 2 GB libres aborta; entre 2 y 5 GB avisa y sigue. |
| A6 | Falta la **Universal CRT** de Windows | Se verifica `ucrtbase.dll`. **Esto era un error mio y ya esta corregido**: antes se buscaba `api-ms-win-crt-runtime-l1-1-0.dll`, que en Windows 10/11 **no es un archivo** sino un nombre virtual que el cargador traduce en memoria. La comprobacion vieja habria abortado **todas** las instalaciones en Windows 11. Ahora, ademas, solo avisa: no detiene. |
| A7 | El EXE se **extrajo a medias** | PASO 0 revisa que esten las cuatro piezas del paquete (`app\backend\dist`, `runtime\node\node.exe`, `runtime\mariadb\bin\mysqld.exe`, `app\database`). Si falta una, aborta. |
| A8 | Truena **antes** de que exista `install.log` | `SetupLogging=yes`: Inno deja su propia bitacora en `%TEMP%\Setup Log*.txt`. Es el unico rastro en ese caso. |
| A9 | Inno abre la pantalla de **"cierre estas aplicaciones"** y se queda esperando un clic | `CloseApplications=no`. En un equipo sin nadie enfrente eso era un bloqueo indefinido. Detener el sistema lo hace `install.ps1` por servicio de Windows, que es lo correcto. |

---

## B. Instalar nuevo vs. actualizar lo que ya existe

Este es el punto mas delicado: si el EXE se confunde y cree que es una instalacion nueva, **sembraria datos encima**.

| # | Escenario | Como queda resuelto |
|---|---|---|
| B1 | Reconocer que el equipo **ya opera** | **Seis senales**, no una sola: `version.json`, el `.env` del backend, los servicios de Windows registrados, la carpeta de datos de MariaDB, `backend\dist`, y `uploads` con archivos. Con **cualquiera** de ellas, el camino es ACTUALIZAR. |
| B2 | El cliente instalo en una **ruta distinta** a `C:\POS-iaDoS` | La ruta verdadera se lee del **registro del servicio** (nssm guarda el programa y el directorio). No se adivina. |
| B3 | Doble seguro contra sembrar encima | Antes de sembrar se hace un **censo de filas** sobre 12 tablas (ventas, productos, pedidos, caja...). Si hay **una sola fila**, no siembra. |
| B4 | El seed de pruebas `04_seed_pruebas.sql` trae 16 `TRUNCATE TABLE` | **Nunca se ejecuta** en el camino de actualizacion. Es el vector de perdida total y esta cerrado por los dos guardas de arriba. |
| B5 | Caso extremo: de verdad hace falta sembrar sobre una base con datos | Solo con `/FORZARSEMBRADO`, nunca automatico, y **antes hace un volcado completo**. Si el volcado pesa menos de 1 KB, aborta. |

---

## C. Puertos, servicios y motores

| # | Escenario | Como queda resuelto |
|---|---|---|
| C1 | El puerto **3000 esta ocupado** por otro programa | Busca libre de 3001 a 3040 **antes** de escribir el `.env` y `CREDENCIALES.txt`, para que los dos digan el puerto real. |
| C2 | Hay **otra MariaDB/MySQL** en el 3306 | La empaquetada se mueve a 3307 o al siguiente libre. No se toca la ajena. |
| C3 | El servicio quedo en **borrado pendiente** (`DELETE_PENDING`) | Se espera a que Windows lo suelte antes de `nssm install`. Antes esto hacia fallar el registro del servicio y el instalador seguia de largo. |
| C4 | **Las bitacoras llenan el disco** con los anos | `AppRotateFiles` / `AppRotateOnline` / `AppRotateBytes` a 10 MB en los dos servicios. Se aplica tambien al equipo que **ya existe**, desde `actualizar.ps1`. Sin esto, `backend-stdout.log` crece sin limite y con el disco lleno la base no arranca. |
| C5 | **El motor no es el esperado** | `actualizar.ps1` **no reemplaza** `node\` ni `mariadb\`: el programa nuevo corre sobre el motor que ya esta ahi. Asi no hay que migrar el formato de datos de MariaDB ni se arriesga el runtime. Queda **anotado** cual es, y `REVISAR.bat` lo reporta. |

### C6 — El escenario mas grave que encontre, y el que mas cerca estuvo de pasar

El boton **Actualizar** de la aplicacion lanza `actualizar.ps1` como **proceso hijo del backend**, desprendido, porque lo primero que ese script hace es **detener ese mismo backend**.

El servicio lo administra **nssm**, y nssm trae `AppKillProcessTree` **encendido de fabrica**: al detener el servicio no mata solo al `node.exe`, **recorre el arbol de procesos y mata a los hijos**. El actualizador es hijo del backend. `detached` en Windows no rompe la relacion padre-hijo en la tabla de procesos.

Lo que habria pasado: clic en Actualizar → respaldo hecho → se detiene el servicio → **nssm mata al actualizador en ese mismo instante** → actualizacion a medias, posiblemente con el programa a medio copiar, **y sin que corra el revertir automatico, porque el script que lo haria acaba de morir**. Equipo abajo, a distancia, sin nadie enfrente.

**Resuelto con `AppKillProcessTree 0`**, puesto en dos lugares y las dos son necesarias:

- `install.ps1`, para cualquier equipo nuevo.
- `actualizar.ps1`, **antes** de detener el servicio, porque el equipo de Mariscos23 tiene el servicio creado por una version vieja y traeria el valor peligroso para siempre.

---

## D. La actualizacion, paso por paso

| # | Escenario | Como queda resuelto |
|---|---|---|
| D1 | **Respaldo primero** | Paso 2 de 9, antes de tocar nada: volcado completo de la base, copia de las imagenes, el `.env`, el programa y las pantallas. Si el respaldo falla, **no se actualiza** y el sistema se queda como estaba. |
| D2 | El respaldo **no cabe** en el disco | Se calcula antes. Si no cabe: *"No se toco nada"*. |
| D3 | El **volcado quedo cortado** | Se verifica la marca de fin del dump. Sin ella, aborta: *"un respaldo incompleto es peor que ninguno"*. |
| D4 | **Ensayo previo** | Paso 3: se restaura una copia de su base en una MariaDB temporal y se arranca el programa nuevo contra ella, **sin tocar el POS que esta operando**. Si el ensayo dice que no, se cancela antes de detener el servicio. |
| D5 | El **ensayo no se puede completar** por el entorno (poca memoria, antivirus, sin puerto libre) | Sin salida, el EXE fallaria igual cada vez y el equipo no se podria actualizar nunca a distancia. Ahora el EXE acepta **`/SINENSAYO`** y lo pasa hacia abajo, y el reporte imprime la linea exacta a correr. El respaldo y el revertir automatico **siguen activos**. |
| D6 | **Migracion de esquema** | TypeORM con `synchronize: true` migra solo al arrancar. Los `CREATE TABLE` / `ALTER TABLE` detectados se imprimen en el reporte. |
| D7 | **No arranca** despues de actualizar | Revertir automatico: se regresa al respaldo del paso 2 y el reporte dice *"la actualizacion fallo y el sistema YA REGRESO a la version anterior. Esta operando"*. |
| D8 | **Arranca pero no puede cobrar** (segundo hueco que encontre) | El unico portero era *"el puerto responde"*. Eso prueba que el programa esta vivo, **no que la base responda**. Un backend arriba con MariaDB caida habria pasado como actualizacion exitosa, con el reporte diciendo que todo bien. **Ahora se le pregunta a `/api/health`** y se exige `status=ok` **y** `db=connected`, con 90 segundos de margen por si todavia esta migrando. Si no lo confirma, entra **el mismo** camino de revertir que ya estaba probado. |
| D9 | **Las imagenes y sus URL** (su preocupacion numero uno) | `uploads` **no se toca nunca** en la actualizacion. Las URL se reajustan a la nueva redireccion con un reporte por imagen en `reportes-despues\IMAGENES.txt`. **Ninguna URL se borra**; lo que no se pudo arreglar queda listado. Lo que no se pudo traer de internet conserva su URL original sin cambios. |
| D10 | **Excel antes de sobrescribir** | `exportar-excel.js` genera `datos-completos.xlsx` dentro del respaldo, en modo streaming por bloques. Si el Excel falla, **se reporta pero no detiene nada**: el `.sql` no se ve afectado. |
| D11 | **Dejarlo operando exactamente igual** | Se leen sus ajustes activos antes (`reportes\ajustes.json` + `AJUSTES.txt`) y se **comparan** despues. Las diferencias se listan. |
| D12 | El `.env` con su contrasena y su JWT | Solo se reescribe la linea `APP_VERSION`. El resto no se toca. Si le faltaba `INSTALL_MODE`, se agrega como `local` y se avisa. |
| D13 | **Revertir en cualquier momento** (no negociable) | `REVERTIR.bat` queda en la carpeta, siempre. Restaura base, imagenes, programa, pantallas y configuracion, y **antes guarda el estado de hoy** como red de seguridad. |
| D14 | **Saber si los cambios surtieron efecto** | `version.json` + `APP_VERSION` + el sistema reporta su propia version por `/api/deploy/version`, y se compara con la esperada. Si no coincide, lo dice. |

---

## E. Diagnostico a distancia (nadie va a estar viendo la pantalla)

Dos herramientas y cuatro archivos. Todos en texto plano, pensados para que los mande por mensaje.

**Antes de instalar nada — `REVISAR-EQUIPO.bat`**

Un solo archivo para doble clic. **Solo lee, no escribe nada en el sistema** y **no crea carpetas** (eso era un error mio: creaba `C:\POS-iaDoS` vacia solo para guardar su reporte; ya esta corregido). Reporta: el equipo, donde esta instalado, que version, los servicios, los puertos y `/api/health`, el censo de filas de 19 tablas, cuantas imagenes hay y cuanto pesan, los respaldos que ya existen, los motores (`node -v`, `mysqld --version`) y el espacio libre. Deja `REVISION-EQUIPO.txt` en el Escritorio.

**Despues de instalar — `REVISAR.bat`**, que queda en la carpeta del programa.

### E1 — Cuatro mentiras que tenia el diagnostico, y que son lo peor posible a distancia

`DIAGNOSTICO.bat` es el archivo que el cliente va a correr cuando algo pase, y su reporte es lo unico que yo voy a poder leer. Tenia cuatro defectos. Tres no lo rompian: lo hacian **reportar mal**, que es peor, porque manda a buscar el problema donde no esta. El cuarto era de otro tipo, y es el que mas me preocupa de todos.

1. **Decia CERRADO un puerto abierto.** Los puertos estaban escritos a mano (3000 y 3306). `install.ps1` mueve el backend a 3001-3040 y MariaDB a 3307+ cuando los de fabrica estan ocupados, y lo anota en el `.env`. En un equipo asi, perfectamente sano, el diagnostico reportaba los dos puertos cerrados. **Ahora los lee del `.env`**, de la clave `APP_PORT`, que es exactamente la que lee el programa al arrancar.

2. **Decia haber reparado algo que nunca toco.** El bloque de reparacion de modulos copiaba desde `C:\sites\pos_multitenant_local\installer\staging\...`, que es la carpeta de desarrollo de **mi** maquina. En la computadora del cliente esa ruta no existe, los `xcopy` fallaban en silencio y al final imprimia *"Reparacion de modulos completada."*. **Ahora copia desde el paquete que viene junto al archivo**, verifica que la copia llegara, y si no hay paquete lo dice claramente en vez de inventar.

3. **La contrasena de root llegaba cortada.** El archivo corre con `EnableDelayedExpansion` y la contrasena de root termina en `!`. En cmd, un `!` sin pareja se descarta: se perdia al guardarla **y otra vez** al leerla con `%VAR%`. Resultado: cuando la conexion con el usuario de la aplicacion fallaba y el diagnostico intentaba el respaldo por root, ese respaldo **nunca pudo funcionar** y reportaba "contrasena incorrecta" aunque fuera la correcta. Se escapa al guardarla y se lee con `!VAR!`. Verificado: la contrasena ahora llega con sus 14 caracteres.

4. **El reporte traia su propia contrasena escrita.** Los cuatro `.bat` del paquete se escribian con `Set-Content -Encoding UTF8`, que en el PowerShell que trae Windows **no** escribe UTF-8 pelado: le pega tres bytes invisibles (`EF BB BF`) al principio. cmd no los ignora: los pega al primer comando, asi que la primera linea del archivo, `@echo off`, fallaba con `"<EF BB BF>@echo" no se reconoce como un comando` **y el eco quedaba encendido para todo el resto del archivo**. En `DIAGNOSTICO.bat` eso significa que cada linea que usa la contrasena (`mysql -u... -p...`) se imprimia tal cual en el reporte **antes** de ejecutarse. Ese reporte es justo el archivo que el cliente me manda por mensaje. Ahora los `.bat` se escriben sin la marca; comprobado byte a byte contra el paquete (ver seccion F).

Ademas, la ruta de la instalacion ya no se da por hecha: se saca del registro del servicio, igual que hacen `install.ps1` y `actualizar.ps1`, por si el cliente instalo en otra unidad. Antes reportaba todo como FALTA.

Y la misma falla de los puertos fijos estaba en `services.ps1` (la lista de puertos a revisar y el mensaje "Sistema disponible en...") y en `update.ps1` (la URL final). Los tres leen ahora el puerto real, asi que la direccion que se le da al cliente es una que de verdad abre.

**Los cuatro archivos que hay que pedirle si algo pasa:**

1. `C:\POS-iaDoS\logs\install.log` — la instalacion o la actualizacion completa.
2. `C:\POS-iaDoS\ULTIMO-ENSAYO.txt` — el veredicto del ensayo previo.
3. `REVISION-EQUIPO.txt` (Escritorio) — la foto del equipo.
4. `%TEMP%\Setup Log*.txt` — solo si truena antes de empezar.

---

## F. Tres bytes invisibles: la familia de fallas del doble check final

Esta seccion es el resultado de revisar **como se escriben y como se leen** todos los archivos del paquete, no solo que hagan. Salieron cinco fallas reales, y ninguna da error en pantalla: todas fallan calladas. Dos tocaban directamente promesas que no se negocian, y una habria afectado a los clientes de la nube.

**El origen es uno solo.** `Set-Content -Encoding UTF8`, en el PowerShell 5.1 que trae Windows, no escribe UTF-8 a secas: antepone tres bytes, `EF BB BF`, la llamada marca de orden de bytes. Se usaba en 21 escrituras repartidas en 6 scripts. Quien lee el archivo despues decide si eso le estorba o no:

| Quien lo lee | Que pasa con la marca |
|---|---|
| `cmd.exe` en un `.bat` | **Se rompe.** Pega la marca a `@echo off`, el eco queda encendido y el reporte imprime las lineas con la contrasena. |
| `JSON.parse` de Node | **Se rompe, y en silencio.** `leerJson` del backend truena y su `catch` devuelve `null` sin decir nada. |
| `mysql` al restaurar un volcado | **Se rompe.** `error in your SQL syntax at line 1`. |
| Docker leyendo `docker-compose.yml` | **Se rompe.** Leeria `<EF BB BF>services:`, que no es una clave valida. |
| `dotenv` en un `.env` | Inofensivo. **Comprobado**: dotenv 16.6.1 la quita. |
| `Get-Content -Raw` de PowerShell | Inofensivo. **Comprobado**: la quita. |

Esa tabla la verifique corriendo cada caso, no por lectura. Por eso dos casos bajaron de "roto" a "inofensivo", y por eso se sabe que **el camino de reversion por `REVERTIR.bat` nunca estuvo comprometido**: `revertir.ps1` lee los manifiestos con `Get-Content -Raw | ConvertFrom-Json`, y ahi la marca se quita sola. Lo que si estaba roto era la pantalla de mantenimiento dentro del programa.

### F1 — Los respaldos se mostraban como incompletos y sin forma de revertir

El mas grave de todos, porque pega exactamente donde el cliente dijo *"esta opcion no es negociable"*.

`respaldar.ps1` escribe un `manifest.json` por cada respaldo, y la pantalla de mantenimiento del programa lo lee para armar la lista de puntos de retorno. Con la marca de bytes, `JSON.parse` tronaba, el `catch` devolvia `null`, y el renglon se armaba con `completo: false` y `revertir_con: null`. Es decir: **un respaldo perfectamente bueno, completo, con su volcado y sus imagenes, se le mostraba como incompleto y sin boton para volver atras.**

Se arreglo por los dos lados, a proposito:

* `respaldar.ps1` ya no escribe la marca.
* `leerJson` (`mantenimiento.service.ts`) ahora la quita si viene. Esto es lo que rescata **los respaldos que el cliente ya hizo con la version anterior**, que siguen teniendola y que tienen que poder restaurarse igual.

Comprobado con el archivo viejo de verdad, no con uno simulado:

```
--- manifest_viejo.json  (escrito por la version VIEJA, con marca)
   leerJson ANTES  : {"completo":false,"version":null,"tablas":null,"imagenes":null,"revertir_con":null}
   leerJson AHORA  : {"completo":true,"version":"2.4.4","tablas":47,"imagenes":1182,"revertir_con":"REVERTIR.bat"}
```

### F2 — El respaldo previo a sembrar estaba corrompido y no se podia restaurar

En `install.ps1`, el volcado que se toma **el instante antes de vaciar tablas** en una instalacion sobre datos existentes se escribia asi:

```
& $MYSQLDUMP @argsDump | Set-Content -Encoding UTF8 $archResp
```

Dos fallas en una linea. La tuberia de PowerShell convierte la salida de mysqldump a texto usando la pagina de codigos de la consola y la vuelve a escribir, asi que **todo acento y todo dato binario de su operacion quedaba alterado**; y la marca de bytes hace que `mysql` truene al restaurar. Un respaldo corrompido **y** irrestaurable, tomado en el peor momento posible.

Se cambio al mismo camino que ya usaba `respaldar.ps1` (que estaba bien): `Start-Process` con la salida redirigida, asi que los bytes de mysqldump llegan al archivo tal cual, con `--hex-blob` y `--default-character-set=utf8mb4`. De paso la contrasena salio de la linea de comandos a un `--defaults-extra-file` temporal que se borra en un `finally`, porque la linea de comandos la ve cualquiera con el administrador de tareas. Y el guardia de abajo ahora exige que mysqldump **haya salido con codigo 0**, no solo que el archivo pese mas de 1 KB.

### F3 — Los numeros de version se iban a null

`version.json` lo escriben el build y `actualizar.ps1`, y es el archivo que sostiene el *"para saber si los cambios surtieron efecto o no"*. Con la marca, el backend lo leia como `null`: `version_previa` y `fecha_version` desaparecian. La senal de que la actualizacion sirvio era justo lo que no se podia ver.

### F4 — La marca que habria tumbado la nube de todos los clientes

`docker-compose.yml` **no** tiene marca en el repositorio, pero mi propio build se la estaba poniendo al reescribir la version. Subir eso significa que Docker lee `<EF BB BF>services:` y el stack entero no arranca: **no para Mariscos23, que es offline, sino para todos los clientes que hoy estan arriba en la nube.** El archivo quedo reparado y hoy difiere del repositorio en exactamente una linea, la version.

El mismo archivo traia ademas un `aqui` escrito como `aquÃ­`, que es la falla gemela y es del lado de **leer**.

### F5 — La falla gemela: leer sin decir en que codificacion

Quitar la marca abre un riesgo nuevo, y hay que arreglarlo en la misma entrega. `Get-Content -Raw` **sin** `-Encoding`, sobre un archivo que ya no trae marca, no lee UTF-8: lee con la pagina ANSI de Windows (1252). Mientras los `.json` llevaban marca, PowerShell la veia y acertaba sola; ahora ya no la llevan, asi que hay que decirselo. Un `i` acentuado (`C3 AD` en UTF-8) vuelve como dos caracteres y se reescribe como cuatro bytes: el dano empeora en cada vuelta, y **quitar la marca no lo arregla, porque pasa al leer**.

Con puros numeros de version da igual. Donde importa es en `imagenes.json`, que lista los nombres de sus archivos de imagen: un `pescadilla_añejo.jpg` leido como ANSI **deja de coincidir con el archivo real**, y esa comparacion es la que sostiene lo que el cliente puso como su preocupacion numero uno, que no se pierda ninguna imagen ni ninguna URL. Se le agrego `-Encoding UTF8` a **27 lecturas** de `.json`, `.env`, manifiestos y version, en 9 scripts.

### Como queda cerrado para que no vuelva

No se arreglaron 21 lineas una por una: se metio una funcion, `Set-TextoSinBOM`, en cada script que escribe archivos, y la regla es que **en este paquete no se usa `Set-Content -Encoding UTF8`, nunca**. La funcion y el comentario que explica por que estan dentro de cada script, para que la razon viaje con el codigo.

**Doble check del paquete ya compilado**, que es la unica prueba que vale: los 10 `setup\*.ps1` empaquetados salieron byte a byte identicos a los de staging; 3 de los 4 `.bat` identicos y `INSTALAR.bat` distinto solo en la cadena de la version; y `DIAGNOSTICO.bat`, que antes aparecia **DISTINTO por 3 bytes** (los tres de la marca), ahora aparece **IDENTICO**. Esa es la prueba directa de que la correccion llego al EXE y no se quedo en el codigo fuente.

---

## G. Lo que **NO** queda resuelto

Sin adornos, porque pidio doble check honesto:

1. **El EXE no esta firmado.** SmartScreen va a aparecer **siempre** en Windows 11 Pro. El camino es *Mas informacion* → *Ejecutar de todas formas*. Y si ese equipo tiene **Smart App Control** activo (solo en instalaciones limpias de Windows 11), puede **bloquearlo del todo** y no hay como pasarlo sin firmar el ejecutable o sin apagar esa proteccion. Firmar requiere comprar un certificado de firma de codigo.

2. **No se pudo probar contra su base real.** No hay copia de su base de datos, ni se sabe con certeza que version corre hoy. Por eso el **ensayo previo** existe: es la unica forma de probar contra su base sin tenerla, y corre en su propio equipo antes de tocar nada.

3. **El paquete lleva imagenes de otros clientes.** `build-exe.ps1` copia las 267 imagenes de la carpeta de desarrollo; solo 31 las usan los seeds (29 son del menu de Mariscos23). Las otras 236 son de Autopartes Oviedo y Salchichoneria MC. **No le afectan**: la actualizacion no toca `uploads`, y el paquete no trae `uploads-builtin`. Es peso de mas en el EXE y un tema de limpieza, no un riesgo para el. Lo deje asi a proposito: filtrarlas hoy arriesgaria las imagenes de demostracion de una instalacion nueva, y mandarlas a `uploads-builtin` **si** le empujaria imagenes ajenas al equipo. **Decision suya** si lo limpio en la siguiente.

4. **Tienda en linea y menu digital quedan degradados sin internet.** Es inherente a operar offline, como ya era antes.

5. **Advertencias de Inno al compilar** (no afectan el funcionamiento): `WizardResizable` obsoleto, el identificador `x64` esta en desuso, `MinVersion 6.1` recomienda `6.1sp1`, y el mensaje `WizardFinished` no lo reconoce esta version. Las deje para no cambiar el comportamiento del instalador a ultima hora.

---

## Resumen de lo que se corrigio en esta version

| Hallazgo | Gravedad | Donde |
|---|---|---|
| nssm mataba al actualizador al detener el servicio | **Catastrofico** | `install.ps1`, `actualizar.ps1` |
| El puerto abierto se tomaba como exito; una base caida pasaba como actualizacion buena | **Grave** | `actualizar.ps1` (`/api/health`) |
| La verificacion de la Universal CRT abortaba **toda** instalacion en Windows 10/11 | **Grave** | `install.ps1`, `revisar-equipo.ps1` |
| El EXE no podia pasar `/SINENSAYO`: el equipo quedaba sin forma de actualizarse a distancia | **Grave** | `setup.iss`, `install.ps1` |
| `build-exe.ps1` reportaba "fallo" con el EXE ya bueno | Medio | `build-exe.ps1` |
| La revision creaba carpetas rompiendo su promesa de "solo leer" | Medio | `revisar-equipo.ps1` |
| Bitacoras sin rotacion llenaban el disco con los anos | Medio | `install.ps1`, `actualizar.ps1` |
| Inno podia quedarse esperando un clic en un equipo sin nadie enfrente | Medio | `setup.iss` (`CloseApplications=no`) |
| Si tronaba antes de `install.log` no quedaba ningun rastro | Medio | `setup.iss` (`SetupLogging=yes`) |
| El diagnostico decia CERRADO un puerto abierto (puertos fijos 3000/3306) | **Grave** | `DIAGNOSTICO.bat`, `services.ps1`, `update.ps1` |
| El diagnostico afirmaba reparar modulos copiando desde mi maquina de desarrollo | **Grave** | `DIAGNOSTICO.bat` |
| La contrasena de root llegaba cortada: cmd se comia el `!` final | Medio | `DIAGNOSTICO.bat` |
| El diagnostico daba por hecha la ruta `C:\POS-iaDoS` y reportaba todo como FALTA | Medio | `DIAGNOSTICO.bat` |
| No habia forma de ver con que motor corre el equipo | Bajo | `revisar-equipo.ps1`, `actualizar.ps1` |
| Los tres bytes de la marca rompian `@echo off`: el eco quedaba encendido y `DIAGNOSTICO.bat` imprimia en su reporte las lineas con la contrasena | **Grave** | los 4 `.bat`, `build-exe.ps1` |
| La marca en `manifest.json` hacia que **todo** respaldo bueno se mostrara en el programa como incompleto y sin forma de revertir | **Grave** | `respaldar.ps1`, `mantenimiento.service.ts` |
| El respaldo previo a sembrar se tomaba por tuberia: quedaba corrompido en acentos y binarios, y `mysql` no lo podia restaurar | **Grave** | `install.ps1` |
| El build le ponia marca al `docker-compose.yml`: Docker no habria podido leerlo y se caia la nube de **todos** los clientes | **Grave** | `build-exe.ps1`, `docker-compose.yml` |
| La marca en `version.json` dejaba `version_previa` y `fecha_version` en null: se perdia la senal de si la actualizacion surtio efecto | Medio | `build-exe.ps1`, `actualizar.ps1` |
| Leer sin `-Encoding UTF8` interpretaba los nombres con acentos de `imagenes.json` con la pagina ANSI y dejaban de coincidir con los archivos reales | Medio | 27 lecturas en 9 scripts |
| La contrasena de la base viajaba en la linea de comandos de mysqldump, visible en el administrador de tareas | Bajo | `install.ps1` |
