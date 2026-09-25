; ─────────────────────────────────────────────────────────────────────────────
;  POS-iaDoS Bridge — configuracion de tienda horneada en el instalador
; ─────────────────────────────────────────────────────────────────────────────
;
;  El problema: cada tienda necesita SU token. Recompilar un .exe por tienda seria
;  inviable (70-100 MB y varios minutos cada vez), y pedirle al encargado de una
;  fruteria que pegue un token de 32 caracteres es justo donde se pierden las
;  instalaciones.
;
;  La solucion: se compila UN solo instalador, y el backend lo entrega renombrado
;  con el token de la tienda que lo descarga:
;
;      POS-iaDoS-Bridge__TKN-a1b2c3d4e5f6....exe
;
;  Esto lee su propio nombre, saca el token y lo deja escrito en un .env junto al
;  ejecutable. main.js ya lee ese .env al arrancar (capa 2 de su configuracion),
;  asi que el bridge queda hablando con su tienda sin que nadie escriba nada.
;
;  Si el archivo se renombro y el token no viene, no pasa nada malo: no se escribe
;  .env y el bridge abre solo su ventana de configuracion pidiendo pegarlo. Ese es
;  el unico caso en el que hay algo que copiar y pegar.
;
;  Se usa NSIS puro (sin LogicLib ni plugins de cadenas) a proposito: este archivo
;  lo compila electron-builder con su propio NSIS y mientras menos dependa de el,
;  menos se rompe al actualizar la herramienta.

!macro customInstall
  Push $R1
  Push $R2
  Push $R3
  Push $R4
  Push $R5
  Push $R6

  StrCpy $R4 ""                 ; token encontrado
  StrLen $R1 $EXEFILE
  IntOp $R5 $R1 - 6             ; ultima posicion donde cabe el marcador
  IntCmp $R5 0 tkn_listo tkn_listo 0
  StrCpy $R2 0                  ; posicion actual

tkn_buscar:
  StrCpy $R3 $EXEFILE 6 $R2
  StrCmp $R3 "__TKN-" tkn_hallado
  IntOp $R2 $R2 + 1
  IntCmp $R2 $R5 tkn_buscar tkn_buscar tkn_listo

tkn_hallado:
  IntOp $R2 $R2 + 6
  StrCpy $R4 $EXEFILE "" $R2    ; queda "<token>.exe"
  StrCpy $R3 $R4 "" -4
  StrCmp $R3 ".exe" 0 tkn_malo  ; sin extension no es el archivo que mandamos
  StrCpy $R4 $R4 -4             ; queda "<token>"

  ; El navegador renombra la segunda descarga a "...__TKN-abc (1).exe". Sin esto el
  ; token quedaria como "abc (1)" y el bridge no se conectaria nunca, en silencio.
  ; Se corta en el primer espacio: el token es hexadecimal, no lleva espacios.
  StrLen $R1 $R4
  StrCpy $R2 0
tkn_espacio:
  IntCmp $R2 $R1 tkn_medir tkn_medir_sig tkn_medir
tkn_medir_sig:
  StrCpy $R3 $R4 1 $R2
  StrCmp $R3 " " 0 +3
  StrCpy $R4 $R4 $R2
  Goto tkn_medir
  IntOp $R2 $R2 + 1
  Goto tkn_espacio

tkn_medir:
  ; Un token real son 48 caracteres. Cualquier cosa corta es un archivo renombrado:
  ; mejor no escribir nada y que el bridge pida el token a mano.
  StrLen $R1 $R4
  IntCmp $R1 16 tkn_listo tkn_malo tkn_listo
tkn_malo:
  StrCpy $R4 ""

tkn_listo:
  StrCmp $R4 "" tkn_sin_token

  ; Se escribe junto al ejecutable. La instalacion es por usuario
  ; (%LOCALAPPDATA%\Programs\...), asi que aqui si hay permiso de escritura.
  FileOpen $R6 "$INSTDIR\.env" w
  FileWrite $R6 "# Generado por el instalador de POS-iaDoS Bridge.$\r$\n"
  FileWrite $R6 "# Identifica a esta tienda. Si lo borras, el bridge pedira el token a mano.$\r$\n"
  FileWrite $R6 "BACKEND_URL=https://posapi.iados.online$\r$\n"
  FileWrite $R6 "TIENDA_TOKEN=$R4$\r$\n"
  FileClose $R6
  DetailPrint "Tienda configurada desde el nombre del instalador."
  Goto tkn_fin

tkn_sin_token:
  DetailPrint "Sin token en el nombre del archivo: el bridge lo pedira al abrirse."

tkn_fin:
  Pop $R6
  Pop $R5
  Pop $R4
  Pop $R3
  Pop $R2
  Pop $R1
!macroend
