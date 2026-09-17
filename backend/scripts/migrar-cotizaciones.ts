import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

// Migra las cotizaciones que hoy viven como estados de ecommerce_pedidos:
//   estado='cotizacion'  -> solicitud sin cotizar        -> cotizaciones.solicitada
//   estado='por_cobrar'  -> ya cotizada, con pedido      -> cotizaciones.aceptada + v1
// Idempotente: salta las que ya tengan su fila en `cotizaciones` (se reconocen
// por notas_internas, donde se deja el folio EP- de origen).
//
// Uso:  npx ts-node -r tsconfig-paths/register scripts/migrar-cotizaciones.ts [--dry-run]

const DRY = process.argv.includes('--dry-run');

const ds = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'pos_iados',
  entities: [],
  synchronize: false,
});

function folio(yy: string, n: number) {
  return `COT-${yy}-${String(n).padStart(4, '0')}`;
}

(async () => {
  await ds.initialize();

  const origen = await ds.query(
    `SELECT * FROM ecommerce_pedidos
      WHERE estado IN ('cotizacion', 'por_cobrar')
      ORDER BY empresa_id, created_at ASC`,
  );
  console.log(`${origen.length} registros por migrar${DRY ? ' (dry-run)' : ''}`);

  const consecutivos = new Map<string, number>();
  let migrados = 0, saltados = 0;

  for (const p of origen) {
    const marca = `migrado-de:${p.numero_pedido}`;
    const [ya] = await ds.query(
      'SELECT id FROM cotizaciones WHERE empresa_id = ? AND notas_internas LIKE ? LIMIT 1',
      [p.empresa_id, `%${marca}%`],
    );
    if (ya) { saltados++; continue; }

    const yy = new Date(p.created_at).getFullYear().toString().slice(-2);
    const llave = `${p.empresa_id}-${yy}`;
    if (!consecutivos.has(llave)) {
      const [r] = await ds.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(numero, 8) AS UNSIGNED)), 0) AS max
           FROM cotizaciones WHERE empresa_id = ? AND numero LIKE ?`,
        [p.empresa_id, `COT-${yy}-%`],
      );
      consecutivos.set(llave, Number(r?.max || 0));
    }
    const n = consecutivos.get(llave)! + 1;
    consecutivos.set(llave, n);
    const numero = folio(yy, n);

    const aceptada = p.estado === 'por_cobrar';
    const estado = aceptada ? 'aceptada' : 'solicitada';
    const version_actual = aceptada ? 1 : 0;

    console.log(`  ${p.numero_pedido} (${p.estado}) -> ${numero} (${estado})`);
    if (DRY) { migrados++; continue; }

    await ds.query(
      `INSERT INTO cotizaciones
         (empresa_id, tenant_id, numero, cliente_nombre, cliente_email, cliente_tel,
          cliente_empresa, direccion_envio, notas_cliente, estado, version_actual,
          pedido_id, notas_internas, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.empresa_id, p.tenant_id, numero, p.cliente_nombre, p.cliente_email, p.cliente_tel,
        p.cliente_empresa, p.direccion_envio, p.notas_cliente, estado, version_actual,
        p.pedido_id, `${marca}${p.notas_internas ? ' | ' + p.notas_internas : ''}`,
        p.created_at, p.updated_at,
      ],
    );
    const [creada] = await ds.query(
      'SELECT id FROM cotizaciones WHERE empresa_id = ? AND numero = ? LIMIT 1',
      [p.empresa_id, numero],
    );

    // Version 0 siempre: la solicitud original, sin precios.
    const itemsSinPrecio = (typeof p.items === 'string' ? JSON.parse(p.items) : p.items || [])
      .map((it: any) => ({ ...it, precio_unitario: 0, subtotal: 0 }));
    await ds.query(
      `INSERT INTO cotizacion_versiones
         (cotizacion_id, version, items, subtotal, descuento, total, vigencia_hasta, enviada_at)
       VALUES (?, 0, ?, 0, 0, 0, DATE(?), ?)`,
      [creada.id, JSON.stringify(itemsSinPrecio), p.created_at, p.created_at],
    );

    if (aceptada) {
      // v1 reconstruida de lo que ya se cotizo, marcada como aceptada en la fecha
      // en que el POS la mando a cobrar.
      await ds.query(
        `INSERT INTO cotizacion_versiones
           (cotizacion_id, version, items, subtotal, descuento, total, vigencia_hasta,
            mensaje_cliente, enviada_at, respuesta, respondida_at)
         VALUES (?, 1, ?, ?, ?, ?, DATE(?), NULL, ?, 'aceptada', ?)`,
        [
          creada.id,
          typeof p.items === 'string' ? p.items : JSON.stringify(p.items || []),
          p.subtotal, p.descuento, p.total, p.updated_at, p.updated_at, p.updated_at,
        ],
      );
      // El pedido de mostrador existente queda apuntando a la cotizacion nueva.
      if (p.pedido_id) {
        await ds.query('UPDATE pedidos SET cotizacion_id = ? WHERE id = ?', [creada.id, p.pedido_id]);
      }
    }
    migrados++;
  }

  console.log(`\nMigrados: ${migrados} | Ya existian: ${saltados}`);
  await ds.destroy();
})().catch((e) => { console.error(e); process.exit(1); });
