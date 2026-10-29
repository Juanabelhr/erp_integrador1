// ==========================================================================================
// PROYECTO INTEGRADOR I - UTP (2026)
// SISTEMA ERP EMPRESARIAL COMERCIAL - SCRIPT DE BASE DE DATOS MONGODB (mongosh)
// Equivalente NoSQL de las Tablas y los 14 Procedimientos Almacenados
// ==========================================================================================

use("ERP_Comercial_DB");

// ==========================================================================================
// PARTE 1: CREACIÓN DE COLECCIONES (EQUIVALENTE A LAS TABLAS) Y DATOS SEMILLA
// Nota: En MongoDB, 'detalle_documento' se embebe dentro de 'documentos_comerciales'
// como el arreglo 'detalles[]', reduciendo de 7 tablas relacionales a 6 colecciones (o 7 si se separa).
// ==========================================================================================

// 1. Colección: roles (Tabla: dbo.roles)
db.roles.drop();
db.roles.insertMany([
  { id_rol: 1, nombre_rol: "ADMIN", descripcion: "Administrador General del Sistema", nivel_acceso: 100, activo: true },
  { id_rol: 2, nombre_rol: "VENDEDOR", descripcion: "Encargado de Ventas, Cotizaciones y Clientes", nivel_acceso: 50, activo: true },
  { id_rol: 3, nombre_rol: "COMPRADOR", descripcion: "Encargado de Compras, Almacén y Proveedores", nivel_acceso: 50, activo: true }
]);
db.roles.createIndex({ id_rol: 1 }, { unique: true });
db.roles.createIndex({ nombre_rol: 1 }, { unique: true });

// 2. Colección: usuarios (Tabla: dbo.usuarios)
db.usuarios.drop();
db.usuarios.insertMany([
  {
    id_usuario: 1,
    id_rol: 1,
    nombre_rol: "ADMIN",
    codigo_empleado: "EMP-001",
    nombres: "Lorena",
    apellidos: "Damián Salas",
    email: "admin@erp.com",
    password_hash: "$2a$11$jK8vR9xL2mN4pQ6sT8uV0wXyZ1aB3cD5eF7gH9iJ0kL2mN4pQ6sT8",
    estado: "ACTIVO",
    fecha_creacion: new Date(),
    ultimo_acceso: new Date()
  },
  {
    id_usuario: 2,
    id_rol: 2,
    nombre_rol: "VENDEDOR",
    codigo_empleado: "EMP-002",
    nombres: "Juan Abel",
    apellidos: "Huaman Rafael",
    email: "ventas@erp.com",
    password_hash: "$2a$11$jK8vR9xL2mN4pQ6sT8uV0wXyZ1aB3cD5eF7gH9iJ0kL2mN4pQ6sT8",
    estado: "ACTIVO",
    fecha_creacion: new Date(),
    ultimo_acceso: new Date()
  },
  {
    id_usuario: 3,
    id_rol: 3,
    nombre_rol: "COMPRADOR",
    codigo_empleado: "EMP-003",
    nombres: "Daniel Alejandro",
    apellidos: "Pardo Huancahuari",
    email: "compras@erp.com",
    password_hash: "$2a$11$jK8vR9xL2mN4pQ6sT8uV0wXyZ1aB3cD5eF7gH9iJ0kL2mN4pQ6sT8",
    estado: "ACTIVO",
    fecha_creacion: new Date(),
    ultimo_acceso: new Date()
  },
  {
    id_usuario: 4,
    id_rol: 1,
    nombre_rol: "ADMIN",
    codigo_empleado: "EMP-004",
    nombres: "Gustavo Alonso",
    apellidos: "Villarreal Calle",
    email: "auditoria@erp.com",
    password_hash: "$2a$11$jK8vR9xL2mN4pQ6sT8uV0wXyZ1aB3cD5eF7gH9iJ0kL2mN4pQ6sT8",
    estado: "ACTIVO",
    fecha_creacion: new Date(),
    ultimo_acceso: new Date()
  }
]);
db.usuarios.createIndex({ email: 1 }, { unique: true });
db.usuarios.createIndex({ codigo_empleado: 1 }, { unique: true });

// 3. Colección: socios_negocio (Tabla: dbo.socios_negocio)
db.socios_negocio.drop();
db.socios_negocio.insertMany([
  { id_socio: 1, codigo_socio: "C20556789023", tipo_socio: "C", tipo_documento: "RUC", numero_documento: "20556789023", razon_social: "Comercial Los Andes S.A.C.", direccion: "Av. Javier Prado Este 2450, San Borja, Lima", telefono: "987654321", correo: "compras@losandes.pe", condicion_pago: "FACTURA 30 DIAS", moneda_defecto: "PEN", estado: "ACTIVO", fecha_creacion: new Date() },
  { id_socio: 2, codigo_socio: "C20123456789", tipo_socio: "C", tipo_documento: "RUC", numero_documento: "20123456789", razon_social: "Distribuidora Norte S.A.C.", direccion: "Av. Alfredo Mendiola 3810, Los Olivos, Lima", telefono: "912345678", correo: "logistica@distnorte.com.pe", condicion_pago: "CONTADO", moneda_defecto: "PEN", estado: "ACTIVO", fecha_creacion: new Date() },
  { id_socio: 3, codigo_socio: "C10456789012", tipo_socio: "C", tipo_documento: "RUC", numero_documento: "10456789012", razon_social: "Inversiones San Martín E.I.R.L.", direccion: "Jr. de la Unión 840, Cercado de Lima", telefono: "965777665", correo: "gerencia@invsanmartin.pe", condicion_pago: "CONTADO", moneda_defecto: "PEN", estado: "ACTIVO", fecha_creacion: new Date() },
  { id_socio: 4, codigo_socio: "C20543210987", tipo_socio: "C", tipo_documento: "RUC", numero_documento: "20543210987", razon_social: "Mega Import S.A.C.", direccion: "Calle Los Negocios 420, Surquillo, Lima", telefono: "945678912", correo: "ventas@megaimport.pe", condicion_pago: "FACTURA 15 DIAS", moneda_defecto: "PEN", estado: "ACTIVO", fecha_creacion: new Date() },
  { id_socio: 5, codigo_socio: "C20665432109", tipo_socio: "C", tipo_documento: "RUC", numero_documento: "20665432109", razon_social: "Grupo Ferretero Perú S.A.C.", direccion: "Av. Argentina 1850, Callao", telefono: "976542310", correo: "pedidos@grupoferretero.pe", condicion_pago: "CONTADO", moneda_defecto: "PEN", estado: "ACTIVO", fecha_creacion: new Date() },
  { id_socio: 6, codigo_socio: "P20998877665", tipo_socio: "S", tipo_documento: "RUC", numero_documento: "20998877665", razon_social: "Proveedor Industrial S.A.C.", direccion: "Av. Nicolás Ayllón 3120, Ate, Lima", telefono: "014358900", correo: "despachos@provindustrial.pe", condicion_pago: "FACTURA 30 DIAS", moneda_defecto: "PEN", estado: "ACTIVO", fecha_creacion: new Date() },
  { id_socio: 7, codigo_socio: "P20445566778", tipo_socio: "S", tipo_documento: "RUC", numero_documento: "20445566778", razon_social: "Tecnología Global S.A.", direccion: "Av. República de Panamá 3540, San Isidro, Lima", telefono: "012214500", correo: "corporativo@tecglobal.com.pe", condicion_pago: "FACTURA 45 DIAS", moneda_defecto: "PEN", estado: "ACTIVO", fecha_creacion: new Date() },
  { id_socio: 8, codigo_socio: "P20334455661", tipo_socio: "S", tipo_documento: "RUC", numero_documento: "20334455661", razon_social: "Suministros Lima S.A.C.", direccion: "Av. Colonial 1220, Cercado de Lima", telefono: "998112233", correo: "cotizaciones@suministroslima.pe", condicion_pago: "CONTADO", moneda_defecto: "PEN", estado: "ACTIVO", fecha_creacion: new Date() }
]);
db.socios_negocio.createIndex({ numero_documento: 1 }, { unique: true });
db.socios_negocio.createIndex({ codigo_socio: 1 }, { unique: true });

// 4. Colección: productos (Tabla: dbo.productos)
db.productos.drop();
db.productos.insertMany([
  { id_producto: 1, codigo_producto: "ART-001", nombre_producto: "Laptop Lenovo ThinkPad T14 Gen 4", categoria: "Cómputo", unidad_medida: "NIU", precio_compra: 3600.00, precio_venta: 4500.00, stock_actual: 32, stock_minimo: 5, estado: "ACTIVO", fecha_creacion: new Date() },
  { id_producto: 2, codigo_producto: "ART-002", nombre_producto: "Monitor Dell UltraSharp 27 4K USB-C", categoria: "Monitores", unidad_medida: "NIU", precio_compra: 920.00, precio_venta: 1250.00, stock_actual: 45, stock_minimo: 8, estado: "ACTIVO", fecha_creacion: new Date() },
  { id_producto: 3, codigo_producto: "ART-003", nombre_producto: "Laptop HP ProBook 450 G10 15.6\"", categoria: "Cómputo", unidad_medida: "NIU", precio_compra: 1650.00, precio_venta: 2100.00, stock_actual: 28, stock_minimo: 5, estado: "ACTIVO", fecha_creacion: new Date() },
  { id_producto: 4, codigo_producto: "ART-004", nombre_producto: "Mouse Inalámbrico Logitech MX Master 3S", categoria: "Accesorios", unidad_medida: "NIU", precio_compra: 180.00, precio_venta: 260.00, stock_actual: 110, stock_minimo: 15, estado: "ACTIVO", fecha_creacion: new Date() },
  { id_producto: 5, codigo_producto: "ART-005", nombre_producto: "Teclado Mecánico Corporativo Keychron K8", categoria: "Accesorios", unidad_medida: "NIU", precio_compra: 210.00, precio_venta: 310.00, stock_actual: 65, stock_minimo: 10, estado: "ACTIVO", fecha_creacion: new Date() },
  { id_producto: 6, codigo_producto: "ART-006", nombre_producto: "Impresora Multifuncional Epson EcoTank L5290", categoria: "Impresión", unidad_medida: "NIU", precio_compra: 750.00, precio_venta: 1050.00, stock_actual: 4, stock_minimo: 6, estado: "ACTIVO", fecha_creacion: new Date() },
  { id_producto: 7, codigo_producto: "ART-007", nombre_producto: "Servidor Torre Dell PowerEdge T150 Xeon", categoria: "Infraestructura", unidad_medida: "NIU", precio_compra: 5200.00, precio_venta: 6800.00, stock_actual: 3, stock_minimo: 5, estado: "ACTIVO", fecha_creacion: new Date() }
]);
db.productos.createIndex({ codigo_producto: 1 }, { unique: true });

// 5 y 6. Colección: documentos_comerciales (Tablas: dbo.documentos_comerciales + dbo.detalle_documento embebido)
db.documentos_comerciales.drop();
db.documentos_comerciales.insertMany([
  {
    id_documento: 1001,
    nro_transaccion_ext: 15423,
    serie_correlativo: "F001-0001245",
    tipo_documento: "PEDIDO",
    id_socio: 1,
    codigo_socio: "C20556789023",
    razon_social_socio: "Comercial Los Andes S.A.C.",
    id_usuario_creador: 1,
    fecha_emision: new Date(),
    fecha_vencimiento: new Date(),
    fecha_documento: new Date(),
    moneda: "PEN",
    tipo_cambio: 3.75,
    condicion_pago: "FACTURA 30 DIAS",
    id_vendedor: 1,
    subtotal: 9000.00,
    impuesto_igv: 1620.00,
    monto_total: 10620.00,
    estado_proceso: "SINCRONIZADO",
    estado_flujo: "ABIERTO",
    observaciones: "Equipamiento de oficinas sede San Borja",
    detalles: [
      {
        num_linea: 1,
        codigo_producto: "ART-001",
        descripcion_item: "Laptop Lenovo ThinkPad T14 Gen 4",
        cantidad: 2,
        precio_unitario: 4500.00,
        porcentaje_descuento: 0,
        tipo_impuesto: "IGV",
        unidad_medida: "NIU",
        id_almacen: "ALM01",
        monto_linea: 9000.00
      }
    ]
  }
]);
db.documentos_comerciales.createIndex({ id_documento: 1 }, { unique: true });
db.documentos_comerciales.createIndex({ serie_correlativo: 1 });

// 7. Colección: logs_sincronizacion (Tabla: dbo.logs_sincronizacion)
db.logs_sincronizacion.drop();
db.logs_sincronizacion.insertMany([
  {
    id_log: 1,
    id_documento: 1001,
    tipo_documento: "PEDIDO",
    entidad_destino: "Ventas - Pedidos",
    tipo_operacion: "REGISTRO",
    fecha_ejecucion: new Date(),
    estado: "SINCRONIZADO",
    nro_transaccion_ext: 15423,
    codigo_error: 0,
    mensaje_respuesta: "Transacción confirmada con éxito en base de datos. N° Operación: 15423",
    payload_json: "{\"codigoSocio\":\"C20556789023\",\"moneda\":\"PEN\"}"
  }
]);
db.logs_sincronizacion.createIndex({ id_documento: 1 });
