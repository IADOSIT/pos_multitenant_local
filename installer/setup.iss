; =============================================================================
; POS-iaDoS - Inno Setup 6 Script
; Instalador profesional para Windows
; =============================================================================

#define MyAppName      "POS-iaDoS"
; La version la inyecta build-exe.ps1 via /DMyAppVersion=x.x.x
#ifndef MyAppVersion
  #define MyAppVersion "2.2.58"
#endif
#define MyAppPublisher "iaDoS"
#define MyAppURL       "https://iados.mx"
#define MyInstallDir   "C:\POS-iaDoS"

; Estos valores los inyecta build-exe.ps1 via /D al compilar
#ifndef InstallMode
  #define InstallMode "local"
#endif
#ifndef OutputName
  #define OutputName "POS-iaDoS-Local-v" + MyAppVersion
#endif
#ifndef SourceDir
  #define SourceDir "output\POS-iaDoS-Local-v" + MyAppVersion + "-src"
#endif

[Setup]
; Identificador único de la aplicación (no cambiar entre versiones)
AppId={{F3A7B2C1-D4E5-4F60-9ABC-DEF012345678}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} v{#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Directorio de instalación fijo (el instalador siempre usa C:\POS-iaDoS)
DefaultDirName={#MyInstallDir}
DisableDirPage=yes

; Grupo en menú inicio
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=no

; Salida
OutputDir=output
OutputBaseFilename={#OutputName}

; Compresión máxima
Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes

; Apariencia - Wizard moderno de Inno Setup 6
WizardStyle=modern
WizardResizable=no

; Icono del instalador y desinstalador (generado por build-exe.ps1)
#define IconFile "assets\pos-iados.ico"
#if FileExists(IconFile)
SetupIconFile={#IconFile}
UninstallDisplayIcon={#IconFile}
#endif

; Licencia
LicenseFile={#SourceDir}\LICENSE.txt

; Privilegios y requisitos del sistema
PrivilegesRequired=admin
MinVersion=6.1
ArchitecturesInstallIn64BitMode=x64

; Información de versión del EXE
VersionInfoVersion={#MyAppVersion}.0
VersionInfoProductName={#MyAppName}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} - Sistema Punto de Venta Multitenant
VersionInfoCopyright=Copyright (C) 2024-2026 {#MyAppPublisher}
VersionInfoProductVersion={#MyAppVersion}.0

; Desinstalador
UninstallDisplayName={#MyAppName} v{#MyAppVersion}
CreateUninstallRegKey=yes
Uninstallable=yes

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Messages]
spanish.SetupAppTitle=Instalador de {#MyAppName}
spanish.SetupWindowTitle=Instalación de {#MyAppName} v{#MyAppVersion}
spanish.WizardReady=Listo para instalar
spanish.ReadyLabel1=El instalador está listo para instalar {#MyAppName} en su equipo.
spanish.ReadyLabel2b=Haga clic en Instalar para continuar con la instalación.
spanish.WizardInstalling=Instalando
spanish.InstallingLabel=Por favor espere mientras {#MyAppName} se instala en su equipo...
spanish.WizardFinished=Instalación completada
spanish.FinishedHeadingLabel=Instalación de {#MyAppName} completada
spanish.UninstallAppFullTitle=Desinstalación de {#MyAppName}

[Files]
; Extraer todos los archivos al directorio temporal del proceso
; install.ps1 copia todo a C:\POS-iaDoS y realiza la configuración
Source: "{#SourceDir}\*"; DestDir: "{tmp}\POS-iaDoS-Src"; \
  Flags: ignoreversion recursesubdirs createallsubdirs

; Icono instalado en la carpeta de la aplicación para accesos directos
#if FileExists(IconFile)
Source: "{#IconFile}"; DestDir: "{app}"; Flags: ignoreversion
#endif

; Guía de primer uso (se copia a C:\POS-iaDoS\)
Source: "staging\PRIMER_USO.html"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
; Menú inicio
Name: "{group}\Abrir POS-iaDoS (Navegador)"; \
  Filename: "{sys}\cmd.exe"; \
  Parameters: "/c start """" http://localhost:3000"; \
  WorkingDir: "{#MyInstallDir}"; \
  IconFilename: "{app}\pos-iados.ico"; \
  Comment: "Abre POS-iaDoS en el navegador predeterminado"

Name: "{group}\Administrador de Servicios"; \
  Filename: "{#MyInstallDir}\setup\services.ps1"; \
  WorkingDir: "{#MyInstallDir}"

Name: "{group}\Guía de Primer Uso"; \
  Filename: "{app}\PRIMER_USO.html"; \
  Comment: "Abre la guía de configuración inicial"

Name: "{group}\Desinstalar {#MyAppName}"; \
  Filename: "{uninstallexe}"

; Acceso directo en escritorio (opcional)
Name: "{commondesktop}\POS-iaDoS"; \
  Filename: "{sys}\cmd.exe"; \
  Parameters: "/c start """" http://localhost:3000"; \
  WorkingDir: "{#MyInstallDir}"; \
  IconFilename: "{app}\pos-iados.ico"; \
  Comment: "Abre POS-iaDoS en el navegador predeterminado"; \
  Tasks: desktopicon

[Tasks]
Name: "desktopicon"; \
  Description: "Crear acceso directo en el &escritorio"; \
  GroupDescription: "Accesos directos adicionales:"

Name: "demodata"; \
  Description: "Instalar datos de demostración (categorías, productos y menú digital QR)"; \
  GroupDescription: "Datos iniciales:"

[Run]
; Ejecutar install.ps1 con los archivos extraídos al directorio temporal
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; \
  Parameters: "-ExecutionPolicy Bypass -NoProfile -NonInteractive -File ""{tmp}\POS-iaDoS-Src\setup\install.ps1"" -InstallerPath ""{tmp}\POS-iaDoS-Src"" -InstallDemoData {code:GetDemoDataFlag} -AdminEmail ""{code:GetAdminEmail}"" -NombreNegocio ""{code:GetNombreNegocio}"""; \
  StatusMsg: "Instalando POS-iaDoS... (esto puede tardar varios minutos)"; \
  Flags: runhidden waituntilterminated

; Abrir guía de primer uso en el navegador predeterminado
Filename: "{app}\PRIMER_USO.html"; \
  Description: "Ver guía de primer uso (abre en el navegador)"; \
  Flags: shellexec postinstall nowait skipifsilent

[UninstallRun]
; Ejecutar uninstall.ps1 para detener servicios y limpiar
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; \
  Parameters: "-ExecutionPolicy Bypass -NoProfile -NonInteractive -File ""{#MyInstallDir}\tools\uninstall.ps1"""; \
  RunOnceId: "POS-iaDoS-Uninstall"; \
  Flags: runhidden waituntilterminated skipifdoesntexist

[Code]
// =============================================================================
// POS-iaDoS — Código Pascal del instalador
// Incluye: página de configuración del cliente, credenciales en pantalla final,
// guía de primer uso y confirmación antes de cerrar.
// =============================================================================

var
  PageCliente    : TInputQueryWizardPage;
  GAdminEmail    : String;
  GNombreNegocio : String;
  GCredOk        : Boolean;

// ── Helpers ──────────────────────────────────────────────────────────────────

function GetDomain(Email: String): String;
var
  AtPos: Integer;
begin
  AtPos := Pos('@', Email);
  if AtPos > 0 then
    Result := Copy(Email, AtPos + 1, Length(Email))
  else
    Result := 'negocio.mx';
end;

// ── Getters para {code:...} en [Run] ─────────────────────────────────────────

function GetDemoDataFlag(Param: String): String;
begin
  if WizardIsTaskSelected('demodata') then Result := '1' else Result := '0';
end;

function GetAdminEmail(Param: String): String;
begin
  Result := GAdminEmail;
end;

function GetNombreNegocio(Param: String): String;
begin
  Result := GNombreNegocio;
end;

// ── Inicialización del asistente ──────────────────────────────────────────────

procedure InitializeWizard();
begin
  GAdminEmail    := '';
  GNombreNegocio := '';
  GCredOk        := False;

  // Texto de bienvenida
  WizardForm.WelcomeLabel2.Caption :=
    '{#MyAppName} v{#MyAppVersion} instalará los siguientes componentes:' + #13#10 +
    '' + #13#10 +
    '  • MariaDB 11    — base de datos' + #13#10 +
    '  • Node.js 20    — servidor de aplicación' + #13#10 +
    '  • NSSM          — servicios de Windows' + #13#10 +
    '  • POS-iaDoS     — sistema punto de venta' + #13#10 +
    '' + #13#10 +
    'Directorio : C:\POS-iaDoS' + #13#10 +
    'Espacio    : ~500 MB' + #13#10 +
    '' + #13#10 +
    'Los servicios arrancan automáticamente con Windows.' + #13#10 +
    'Cierre otras aplicaciones antes de continuar.';

  // ── Página de configuración del cliente (después de licencia) ──────────────
  PageCliente := CreateInputQueryPage(
    wpLicense,
    'Configuración del Negocio',
    'Configure el acceso al sistema',
    'Ingresa el correo del administrador. El cajero y mesero se crearán' + #13#10 +
    'automáticamente usando el mismo dominio de correo.' + #13#10 +
    '' + #13#10 +
    '  Admin    →  email que ingreses     /  admin123  /  PIN 0000' + #13#10 +
    '  Cajero   →  cajero@tudominio.mx    /  cajero123 /  PIN 1234' + #13#10 +
    '  Mesero   →  mesero@tudominio.mx    /  mesero123 /  PIN 5678'
  );

  PageCliente.Add('Correo del administrador:', False);
  PageCliente.Add('Nombre del negocio:', False);

  PageCliente.Values[0] := 'admin@minegocio.mx';
  PageCliente.Values[1] := 'Mi Negocio';
end;

// ── Validación y captura de datos ─────────────────────────────────────────────

function NextButtonClick(CurPageID: Integer): Boolean;
var
  Email, Nombre: String;
begin
  Result := True;

  // Validar la página de configuración del cliente
  if CurPageID = PageCliente.ID then
  begin
    Email  := Trim(PageCliente.Values[0]);
    Nombre := Trim(PageCliente.Values[1]);

    if (Length(Email) < 5) or (Pos('@', Email) = 0) or (Pos('.', Email) = 0) then
    begin
      MsgBox(
        'Por favor ingresa un correo válido.' + #13#10 +
        'Ejemplo: admin@minegocio.mx',
        mbError, MB_OK);
      Result := False;
      Exit;
    end;

    if Length(Nombre) < 2 then
    begin
      MsgBox('Por favor ingresa el nombre del negocio.', mbError, MB_OK);
      Result := False;
      Exit;
    end;

    // Rechazar caracteres que rompen PowerShell
    if (Pos('"', Email) > 0) or (Pos('"', Nombre) > 0) then
    begin
      MsgBox(
        'El correo y el nombre no pueden contener comillas dobles.',
        mbError, MB_OK);
      Result := False;
      Exit;
    end;

    GAdminEmail    := Email;
    GNombreNegocio := Nombre;
  end;

  // ── Confirmación ANTES de cerrar la página de finalización ────────────────
  if CurPageID = wpFinished then
  begin
    if not GCredOk then
    begin
      if MsgBox(
        '⚠  ¿Ya anotaste tus credenciales de acceso?' + #13#10#13#10 +
        'Sin ellas no podrás ingresar al sistema.' + #13#10 +
        'También las encontrarás en:' + #13#10 +
        '   C:\POS-iaDoS\CREDENCIALES.txt' + #13#10#13#10 +
        'Haz clic en SÍ solo si ya las tienes anotadas o guardadas.',
        mbConfirmation,
        MB_YESNO or MB_DEFBUTTON2
      ) = IDYES then
        GCredOk := True
      else
      begin
        Result := False;
        Exit;
      end;
    end;
  end;
end;

// ── Página de finalización con credenciales y guía de primer uso ──────────────

procedure CurPageChanged(CurPageID: Integer);
var
  Dom, FinText: String;
begin
  if CurPageID = wpFinished then
  begin
    Dom := GetDomain(GAdminEmail);

    FinText :=
      '{#MyAppName} v{#MyAppVersion} instalado correctamente.' + #13#10 +
      '' + #13#10 +
      'URL de acceso:  http://localhost:3000' + #13#10 +
      '' + #13#10 +
      '══ CREDENCIALES ═════════════════════════════' + #13#10 +
      'ADMINISTRADOR' + #13#10 +
      '  Email:       ' + GAdminEmail + #13#10 +
      '  Contraseña:  admin123    PIN: 0000' + #13#10 +
      '' + #13#10 +
      'CAJERO  (creado automáticamente)' + #13#10 +
      '  Email:       cajero@' + Dom + #13#10 +
      '  Contraseña:  cajero123   PIN: 1234' + #13#10 +
      '' + #13#10 +
      'MESERO  (creado automáticamente)' + #13#10 +
      '  Email:       mesero@' + Dom + #13#10 +
      '  Contraseña:  mesero123   PIN: 5678' + #13#10 +
      '' + #13#10 +
      '══ PRIMER USO ═══════════════════════════════' + #13#10 +
      '1.  Abre http://localhost:3000  →  inicia sesión' + #13#10 +
      '2.  Configuración → Ticket      →  nombre y dirección' + #13#10 +
      '3.  Configuración → POS         →  modo mostrador / mesa' + #13#10 +
      '4.  Productos                   →  categorías y productos' + #13#10 +
      '5.  Caja                        →  abre primera sesión' + #13#10 +
      '6.  POS                         →  comienza a vender' + #13#10 +
      '' + #13#10 +
      '══ CELULARES Y TABLETS (misma red WiFi) ═════' + #13#10 +
      '  Reemplaza localhost por la IP del servidor' + #13#10 +
      '  Autocobro QR   : Config → Menú Digital' + #13#10 +
      '  Meseros tablet  : Config → POS → Self Order' + #13#10 +
      '' + #13#10 +
      'Credenciales guardadas en  C:\POS-iaDoS\CREDENCIALES.txt';

    WizardForm.FinishedLabel.Caption := FinText;
  end;
end;

// ── Verificar instalación previa ──────────────────────────────────────────────

function InitializeSetup(): Boolean;
var
  Response: Integer;
begin
  Result := True;

  if DirExists('{#MyInstallDir}') then
  begin
    Response := MsgBox(
      'Se detectó una instalación existente de POS-iaDoS en:' + #13#10 +
      '{#MyInstallDir}' + #13#10#13#10 +
      'Si continúa, será reemplazada.' + #13#10 +
      '¿Desea continuar?',
      mbConfirmation,
      MB_YESNO or MB_DEFBUTTON2
    );

    if Response = IDNO then
      Result := False;
  end;
end;
