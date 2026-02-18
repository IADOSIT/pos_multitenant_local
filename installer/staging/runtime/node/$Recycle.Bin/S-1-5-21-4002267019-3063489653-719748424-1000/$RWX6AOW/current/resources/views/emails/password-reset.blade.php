<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .logo { width: 60px; height: 60px; background: #16a34a; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; }
    .content { background: #f9fafb; border-radius: 12px; padding: 30px; margin: 20px 0; }
    .btn { display: inline-block; background: #16a34a; color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <span style="color: white; font-weight: bold; font-size: 20px;">E</span>
      </div>
      <h1 style="color: #166534; margin-top: 15px;">EMC Abastos</h1>
    </div>

    <div class="content">
      <h2>Hola{{ isset($user->name) ? ' ' . $user->name : '' }},</h2>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
      <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>

      <div style="text-align: center;">
        <a href="{{ $resetUrl }}" class="btn">Restablecer contraseña</a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">Este enlace expirará en 2 horas.</p>
      <p style="color: #6b7280; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
    </div>

    <div class="footer">
      <p>Este correo fue enviado desde EMC Abastos</p>
      <p>Desarrollado por iaDoS.mx</p>
    </div>
  </div>
</body>
</html>
