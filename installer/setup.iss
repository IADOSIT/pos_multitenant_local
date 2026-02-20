; =============================================================================
; POS-iaDoS - Inno Setup 6 Script
; Instalador profesional para Windows
; Versión: 1.1.0
; =============================================================================

#define MyAppName      "POS-iaDoS"
#define MyAppVersion   "1.1.0"
#define MyAppPublisher "iaDoS"
#define MyAppURL       "https://iados.mx"
#define MyInstallDir   "C:\POS-iaDoS"
#define SourceDir      "output\POS-iaDoS-v1.1.0"

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
OutputBaseFilename=POS-iaDoS-Setup-v{#MyAppVersion}

; Compresión máxima
Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes

; Apariencia - Wizard moderno de Inno Setup 6
WizardStyle=modern
WizardResizable=no

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

[Icons]
; Menú inicio
Name: "{group}\Abrir POS-iaDoS (Navegador)"; \
  Filename: "{sys}\cmd.exe"; \
  Parameters: "/c start """" http://localhost:3000"; \
  WorkingDir: "{#MyInstallDir}"; \
  Comment: "Abre POS-iaDoS en el navegador predeterminado"

Name: "{group}\Administrador de Servicios"; \
  Filename: "{#MyInstallDir}\setup\services.ps1"; \
  WorkingDir: "{#MyInstallDir}"

Name: "{group}\Desinstalar {#MyAppName}"; \
  Filename: "{uninstallexe}"

; Acceso directo en escritorio (opcional)
Name: "{commondesktop}\POS-iaDoS"; \
  Filename: "{sys}\cmd.exe"; \
  Parameters: "/c start """" http://localhost:3000"; \
  WorkingDir: "{#MyInstallDir}"; \
  Comment: "Abre POS-iaDoS en el navegador predeterminado"; \
  Tasks: desktopicon

[Tasks]
Name: "desktopicon"; \
  Description: "Crear acceso directo en el &escritorio"; \
  GroupDescription: "Accesos directos adicionales:"

[Run]
; Ejecutar install.ps1 con los archivos extraídos al directorio temporal
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; \
  Parameters: "-ExecutionPolicy Bypass -NoProfile -NonInteractive -File ""{tmp}\POS-iaDoS-Src\setup\install.ps1"" -InstallerPath ""{tmp}\POS-iaDoS-Src"""; \
  StatusMsg: "Instalando POS-iaDoS... (esto puede tardar varios minutos)"; \
  Flags: runhidden waituntilterminated

[UninstallRun]
; Ejecutar uninstall.ps1 para detener servicios y limpiar
Filename: "{sys}\WindowsPowerShell\v1.0\powershell.exe"; \
  Parameters: "-ExecutionPolicy Bypass -NoProfile -NonInteractive -File ""{#MyInstallDir}\setup\uninstall.ps1"""; \
  RunOnceId: "POS-iaDoS-Uninstall"; \
  Flags: runhidden waituntilterminated skipifdoesntexist

[Code]
// =============================================================================
// Código Pascal para personalizar el instalador
// =============================================================================

procedure InitializeWizard();
var
  WelcomeText: String;
begin
  // Personalizar texto de bienvenida
  WelcomeText :=
    'Este asistente instalará {#MyAppName} v{#MyAppVersion} en su equipo.' + #13#10 +
    #13#10 +
    'Componentes que se instalarán:' + #13#10 +
    '  • MariaDB 11 — Base de datos' + #13#10 +
    '  • Node.js 20 LTS — Servidor de aplicaciones' + #13#10 +
    '  • NSSM — Administrador de servicios Windows' + #13#10 +
    '  • POS-iaDoS — Backend + Frontend web' + #13#10 +
    #13#10 +
    'Directorio de instalación: C:\POS-iaDoS' + #13#10 +
    'Espacio requerido: ~500 MB' + #13#10 +
    #13#10 +
    'IMPORTANTE: Cierre otras aplicaciones antes de continuar.';

  WizardForm.WelcomeLabel2.Caption := WelcomeText;
end;

procedure CurPageChanged(CurPageID: Integer);
var
  FinishedText: String;
begin
  // Personalizar página de finalización
  if CurPageID = wpFinished then
  begin
    FinishedText :=
      'POS-iaDoS v{#MyAppVersion} se instaló exitosamente.' + #13#10 +
      #13#10 +
      'Acceso al sistema:' + #13#10 +
      '  http://localhost:3000' + #13#10 +
      #13#10 +
      'Credenciales iniciales de administrador:' + #13#10 +
      '  Usuario:     admin@iados.mx' + #13#10 +
      '  Contraseña:  admin123' + #13#10 +
      #13#10 +
      'Los servicios se inician automáticamente con Windows.' + #13#10 +
      'Soporte: iados.mx';

    WizardForm.FinishedLabel.Caption := FinishedText;
  end;
end;

// Verificar si ya existe una instalación previa
function InitializeSetup(): Boolean;
var
  ExistingVersion: String;
  Response: Integer;
begin
  Result := True;

  if DirExists('{#MyInstallDir}') then
  begin
    Response := MsgBox(
      'Se detectó una instalación existente de POS-iaDoS en:' + #13#10 +
      '{#MyInstallDir}' + #13#10 + #13#10 +
      'Si continúa, la instalación existente será reemplazada.' + #13#10 +
      '¿Desea continuar?',
      mbConfirmation,
      MB_YESNO or MB_DEFBUTTON2
    );

    if Response = IDNO then
      Result := False;
  end;
end;
