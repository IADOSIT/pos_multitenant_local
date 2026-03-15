import * as path from 'path';
import * as fs from 'fs/promises';
import { BadRequestException } from '@nestjs/common';

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'];

/**
 * Guarda una imagen subida en la carpeta uploads/.
 * Convierte .heic/.heif a JPEG automáticamente.
 * Retorna la URL relativa: /api/uploads/<filename>
 */
export async function saveUploadedImage(
  file: Express.Multer.File,
  prefix: string = 'img',
): Promise<string> {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED.includes(ext)) {
    throw new BadRequestException(
      `Formato no soportado: ${ext || 'sin extension'}. Usa JPG, PNG, WEBP, GIF o HEIC.`,
    );
  }

  const uploadDir = path.join(process.cwd(), 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });

  const isHeic = ext === '.heic' || ext === '.heif';
  const outExt = isHeic ? '.jpg' : ext;
  const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}${outExt}`;
  const filepath = path.join(uploadDir, filename);

  if (isHeic) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const heicConvert = require('heic-convert');
      const outputBuffer = await heicConvert({
        buffer: file.buffer,
        format: 'JPEG',
        quality: 0.9,
      });
      await fs.writeFile(filepath, Buffer.from(outputBuffer));
    } catch (e) {
      throw new BadRequestException(`No se pudo convertir el archivo HEIC: ${e.message}`);
    }
  } else {
    await fs.writeFile(filepath, file.buffer);
  }

  return `/api/uploads/${filename}`;
}
