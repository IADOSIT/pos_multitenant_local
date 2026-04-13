"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveUploadedImage = saveUploadedImage;
const path = require("path");
const fs = require("fs/promises");
const common_1 = require("@nestjs/common");
const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'];
async function saveUploadedImage(file, prefix = 'img') {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.includes(ext)) {
        throw new common_1.BadRequestException(`Formato no soportado: ${ext || 'sin extension'}. Usa JPG, PNG, WEBP, GIF o HEIC.`);
    }
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const isHeic = ext === '.heic' || ext === '.heif';
    const outExt = isHeic ? '.jpg' : ext;
    const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}${outExt}`;
    const filepath = path.join(uploadDir, filename);
    if (isHeic) {
        try {
            const heicConvert = require('heic-convert');
            const outputBuffer = await heicConvert({
                buffer: file.buffer,
                format: 'JPEG',
                quality: 0.9,
            });
            await fs.writeFile(filepath, Buffer.from(outputBuffer));
        }
        catch (e) {
            throw new common_1.BadRequestException(`No se pudo convertir el archivo HEIC: ${e.message}`);
        }
    }
    else {
        await fs.writeFile(filepath, file.buffer);
    }
    return `/api/uploads/${filename}`;
}
//# sourceMappingURL=upload-image.util.js.map