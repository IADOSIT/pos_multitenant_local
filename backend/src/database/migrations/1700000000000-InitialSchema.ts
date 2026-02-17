import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE tenants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        slug VARCHAR(50) NOT NULL UNIQUE,
        razon_social VARCHAR(200),
        rfc VARCHAR(20),
        direccion VARCHAR(200),
        telefono VARCHAR(20),
        email VARCHAR(100),
        logo_url VARCHAR(500),
        activo BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE empresas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        razon_social VARCHAR(200),
        rfc VARCHAR(20),
        direccion VARCHAR(200),
        telefono VARCHAR(20),
        email VARCHAR(100),
        logo_url VARCHAR(500),
        activo BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant (tenant_id),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE tiendas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        empresa_id INT NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        direccion VARCHAR(200),
        telefono VARCHAR(20),
        email VARCHAR(100),
        zona_horaria VARCHAR(50),
        config_ticket JSON,
        config_impresora JSON,
        activo BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant_empresa (tenant_id, empresa_id),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT,
        empresa_id INT,
        tienda_id INT,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        rol ENUM('superadmin','admin','manager','cajero','mesero') DEFAULT 'cajero',
        pin VARCHAR(20),
        activo BOOLEAN DEFAULT TRUE,
        ultimo_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant_empresa (tenant_id, empresa_id),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE categorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        empresa_id INT NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        descripcion VARCHAR(500),
        imagen_url VARCHAR(500),
        color VARCHAR(20),
        icono VARCHAR(50),
        orden INT DEFAULT 0,
        activo BOOLEAN DEFAULT TRUE,
        es_seccion_especial BOOLEAN DEFAULT FALSE,
        tipo_seccion VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant_empresa (tenant_id, empresa_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        empresa_id INT NOT NULL,
        sku VARCHAR(50) NOT NULL,
        nombre VARCHAR(200) NOT NULL,
        descripcion VARCHAR(500),
        precio DECIMAL(10,2) NOT NULL,
        costo DECIMAL(10,2),
        categoria_id INT,
        imagen_url VARCHAR(500),
        codigo_barras VARCHAR(50),
        unidad VARCHAR(20),
        impuesto_pct DECIMAL(5,2) DEFAULT 0,
        disponible BOOLEAN DEFAULT TRUE,
        activo BOOLEAN DEFAULT TRUE,
        controla_stock BOOLEAN DEFAULT FALSE,
        stock_actual DECIMAL(10,2) DEFAULT 0,
        stock_minimo DECIMAL(10,2),
        orden INT DEFAULT 0,
        modificadores JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant_empresa (tenant_id, empresa_id),
        INDEX idx_sku (sku, tenant_id, empresa_id),
        FOREIGN KEY (categoria_id) REFERENCES categorias(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE producto_tienda (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        tienda_id INT NOT NULL,
        producto_id INT NOT NULL,
        precio_local DECIMAL(10,2),
        disponible BOOLEAN DEFAULT TRUE,
        stock DECIMAL(10,2) DEFAULT 0,
        INDEX idx_tenant_tienda_prod (tenant_id, tienda_id, producto_id),
        FOREIGN KEY (producto_id) REFERENCES productos(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE cajas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        empresa_id INT NOT NULL,
        tienda_id INT NOT NULL,
        usuario_id INT NOT NULL,
        nombre VARCHAR(50) NOT NULL,
        estado ENUM('abierta','cerrada') DEFAULT 'cerrada',
        fondo_apertura DECIMAL(10,2) DEFAULT 0,
        total_ventas DECIMAL(10,2) DEFAULT 0,
        total_entradas DECIMAL(10,2) DEFAULT 0,
        total_salidas DECIMAL(10,2) DEFAULT 0,
        total_esperado DECIMAL(10,2),
        total_real DECIMAL(10,2),
        diferencia DECIMAL(10,2),
        fecha_apertura DATETIME,
        fecha_cierre DATETIME,
        notas_cierre VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant_tienda (tenant_id, tienda_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE movimientos_caja (
        id INT AUTO_INCREMENT PRIMARY KEY,
        caja_id INT NOT NULL,
        usuario_id INT NOT NULL,
        tipo ENUM('entrada','salida') NOT NULL,
        monto DECIMAL(10,2) NOT NULL,
        concepto VARCHAR(200) NOT NULL,
        notas VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_caja (caja_id),
        FOREIGN KEY (caja_id) REFERENCES cajas(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE ventas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        empresa_id INT NOT NULL,
        tienda_id INT NOT NULL,
        caja_id INT NOT NULL,
        usuario_id INT NOT NULL,
        folio VARCHAR(50) NOT NULL,
        folio_offline VARCHAR(50),
        subtotal DECIMAL(10,2) NOT NULL,
        descuento DECIMAL(10,2) DEFAULT 0,
        impuestos DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) NOT NULL,
        metodo_pago ENUM('efectivo','tarjeta','transferencia','mixto') DEFAULT 'efectivo',
        pago_efectivo DECIMAL(10,2),
        pago_tarjeta DECIMAL(10,2),
        pago_transferencia DECIMAL(10,2),
        cambio DECIMAL(10,2) DEFAULT 0,
        estado ENUM('completada','cancelada','pendiente') DEFAULT 'completada',
        notas VARCHAR(500),
        cliente_nombre VARCHAR(200),
        sincronizado BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tenant_empresa_tienda (tenant_id, empresa_id, tienda_id),
        INDEX idx_tenant_fecha (tenant_id, created_at),
        INDEX idx_folio (folio, tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE venta_detalles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        venta_id INT NOT NULL,
        producto_id INT NOT NULL,
        producto_nombre VARCHAR(200) NOT NULL,
        producto_sku VARCHAR(50) NOT NULL,
        cantidad DECIMAL(10,2) NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        descuento DECIMAL(10,2) DEFAULT 0,
        impuesto DECIMAL(10,2) DEFAULT 0,
        subtotal DECIMAL(10,2) NOT NULL,
        modificadores JSON,
        notas VARCHAR(500),
        INDEX idx_venta (venta_id),
        FOREIGN KEY (venta_id) REFERENCES ventas(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE venta_pagos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        venta_id INT NOT NULL,
        metodo ENUM('efectivo','tarjeta','transferencia','mixto') NOT NULL,
        monto DECIMAL(10,2) NOT NULL,
        referencia VARCHAR(100),
        INDEX idx_venta (venta_id),
        FOREIGN KEY (venta_id) REFERENCES ventas(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE ticket_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        empresa_id INT,
        tienda_id INT,
        logo_url VARCHAR(500),
        encabezado_linea1 VARCHAR(200),
        encabezado_linea2 VARCHAR(200),
        encabezado_linea3 VARCHAR(200),
        pie_linea1 VARCHAR(500),
        pie_linea2 VARCHAR(500),
        ancho_papel INT DEFAULT 80,
        columnas INT DEFAULT 42,
        mostrar_logo BOOLEAN DEFAULT TRUE,
        mostrar_fecha BOOLEAN DEFAULT TRUE,
        mostrar_cajero BOOLEAN DEFAULT TRUE,
        mostrar_folio BOOLEAN DEFAULT TRUE,
        mostrar_marca_iados BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_scope (tenant_id, empresa_id, tienda_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE auditoria (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        empresa_id INT,
        tienda_id INT,
        usuario_id INT NOT NULL,
        usuario_nombre VARCHAR(100) NOT NULL,
        accion VARCHAR(50) NOT NULL,
        entidad VARCHAR(50) NOT NULL,
        entidad_id INT,
        datos_anteriores JSON,
        datos_nuevos JSON,
        ip VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tenant_fecha (tenant_id, created_at),
        INDEX idx_entidad (entidad, entidad_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'auditoria', 'ticket_configs', 'venta_pagos', 'venta_detalles', 'ventas',
      'movimientos_caja', 'cajas', 'producto_tienda', 'productos', 'categorias',
      'users', 'tiendas', 'empresas', 'tenants',
    ];
    for (const t of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${t}`);
    }
  }
}
