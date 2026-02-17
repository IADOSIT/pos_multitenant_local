import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../../config/typeorm.config';
import * as bcrypt from 'bcryptjs';

async function seed() {
  const ds = new DataSource(dataSourceOptions);
  await ds.initialize();
  console.log('🌱 Ejecutando seeds POS-iaDoS...');

  // 1. Tenant demo
  const [tenant] = await ds.query(
    `INSERT INTO tenants (nombre, slug, razon_social, email) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE nombre=nombre`,
    ['iaDoS Corp', 'iados-corp', 'iaDoS - Inteligencia Artificial DevOps Solutions', 'info@iados.mx']
  );
  const tenantId = tenant.insertId || 1;

  // 2. Empresa demo
  const [empresa] = await ds.query(
    `INSERT INTO empresas (tenant_id, nombre, razon_social) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE nombre=nombre`,
    [tenantId, 'Restaurante Demo iaDoS', 'Restaurante Demo SA de CV']
  );
  const empresaId = empresa.insertId || 1;

  // 3. Tienda demo
  const [tienda] = await ds.query(
    `INSERT INTO tiendas (tenant_id, empresa_id, nombre, direccion) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE nombre=nombre`,
    [tenantId, empresaId, 'Sucursal Centro', 'Av. Principal #123, Centro']
  );
  const tiendaId = tienda.insertId || 1;

  // 4. SuperAdmin
  const passHash = await bcrypt.hash('admin123', 10);
  await ds.query(
    `INSERT INTO users (tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE nombre=nombre`,
    [tenantId, empresaId, tiendaId, 'Super Admin', 'admin@iados.mx', passHash, 'superadmin', '0000']
  );

  // Cajero demo
  const cajeroPass = await bcrypt.hash('cajero123', 10);
  await ds.query(
    `INSERT INTO users (tenant_id, empresa_id, tienda_id, nombre, email, password, rol, pin)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE nombre=nombre`,
    [tenantId, empresaId, tiendaId, 'Cajero Demo', 'cajero@iados.mx', cajeroPass, 'cajero', '1234']
  );

  // 5. Categorías demo
  const categorias = [
    [tenantId, empresaId, 'Hamburguesas', '#FF6B35', 'burger', 1, false, null],
    [tenantId, empresaId, 'Pizzas', '#E8272C', 'pizza', 2, false, null],
    [tenantId, empresaId, 'Tacos', '#FFA500', 'taco', 3, false, null],
    [tenantId, empresaId, 'Ensaladas', '#4CAF50', 'salad', 4, false, null],
    [tenantId, empresaId, 'Bebidas', '#2196F3', 'drink', 5, true, 'bebidas'],
    [tenantId, empresaId, 'Postres', '#E91E63', 'cake', 6, true, 'postres'],
    [tenantId, empresaId, 'Extras', '#9C27B0', 'plus', 7, true, 'adicionales'],
  ];

  for (const cat of categorias) {
    await ds.query(
      `INSERT INTO categorias (tenant_id, empresa_id, nombre, color, icono, orden, es_seccion_especial, tipo_seccion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nombre=nombre`,
      cat
    );
  }

  // 6. Productos demo
  const productos = [
    ['HAM001', 'Hamburguesa Clásica', 'Carne 150g, lechuga, tomate, cebolla', 89.00, 35.00, 1, 16],
    ['HAM002', 'Hamburguesa Doble', 'Doble carne 300g, queso, tocino', 129.00, 55.00, 1, 16],
    ['HAM003', 'Hamburguesa BBQ', 'Carne 150g, salsa BBQ, aros de cebolla', 99.00, 40.00, 1, 16],
    ['PIZ001', 'Pizza Pepperoni Med', 'Pizza mediana de pepperoni', 149.00, 50.00, 2, 16],
    ['PIZ002', 'Pizza Hawaiana Med', 'Pizza mediana hawaiana', 139.00, 45.00, 2, 16],
    ['TAC001', 'Orden Tacos Pastor (3)', '3 tacos al pastor con piña', 65.00, 25.00, 3, 16],
    ['TAC002', 'Orden Tacos Bistec (3)', '3 tacos de bistec', 75.00, 30.00, 3, 16],
    ['ENS001', 'Ensalada César', 'Lechuga, crutones, parmesano, aderezo', 79.00, 25.00, 4, 16],
    ['BEB001', 'Refresco 600ml', 'Refresco de cola, naranja o limón', 25.00, 12.00, 5, 16],
    ['BEB002', 'Agua Natural 600ml', 'Agua purificada', 15.00, 5.00, 5, 16],
    ['BEB003', 'Jugo Natural', 'Naranja, zanahoria o verde', 35.00, 15.00, 5, 16],
    ['POS001', 'Pastel de Chocolate', 'Rebanada de pastel de chocolate', 55.00, 20.00, 6, 16],
    ['POS002', 'Helado 2 Bolas', 'Helado artesanal, 2 bolas', 45.00, 15.00, 6, 16],
    ['EXT001', 'Extra Queso', 'Porción extra de queso', 15.00, 5.00, 7, 16],
    ['EXT002', 'Extra Tocino', 'Porción extra de tocino', 20.00, 8.00, 7, 16],
    ['EXT003', 'Papas Fritas', 'Porción de papas fritas', 35.00, 12.00, 7, 16],
  ];

  for (const prod of productos) {
    await ds.query(
      `INSERT INTO productos (tenant_id, empresa_id, sku, nombre, descripcion, precio, costo, categoria_id, unidad, impuesto_pct)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pza', ?) ON DUPLICATE KEY UPDATE nombre=VALUES(nombre)`,
      [tenantId, empresaId, ...prod]
    );
  }

  // 7. Config ticket
  await ds.query(
    `INSERT INTO ticket_configs (tenant_id, encabezado_linea1, encabezado_linea2, pie_linea1, pie_linea2, mostrar_marca_iados)
     VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE tenant_id=tenant_id`,
    [tenantId, 'Restaurante Demo iaDoS', 'Av. Principal #123, Centro', 'Gracias por su compra', 'Desarrollado por iaDoS - iados.mx', true]
  );

  console.log('✅ Seeds completados exitosamente');
  console.log('   SuperAdmin: admin@iados.mx / admin123');
  console.log('   Cajero: cajero@iados.mx / cajero123 (PIN: 1234)');
  await ds.destroy();
}

seed().catch(err => {
  console.error('❌ Error en seeds:', err);
  process.exit(1);
});
