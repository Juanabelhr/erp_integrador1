-- ==========================================================================================
-- PROYECTO INTEGRADOR I - UTP (2026)
-- SISTEMA ERP EMPRESARIAL COMERCIAL
-- Script Completo SQL Server: Tablas Relacionales + Procedimientos Almacenados + Datos Semilla
-- ==========================================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'ERP_Comercial_DB')
BEGIN
    CREATE DATABASE ERP_Comercial_DB;
END
GO

USE ERP_Comercial_DB;
GO

-- ==========================================================================================
-- PARTE 1: CREACIÓN DE LAS 7 TABLAS PRINCIPALES DEL SISTEMA ERP
-- ==========================================================================================

-- 1. Tabla: roles
IF OBJECT_ID('dbo.roles', 'U') IS NULL
CREATE TABLE dbo.roles (
    id_rol INT IDENTITY(1,1) PRIMARY KEY,
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,      -- ADMIN, VENDEDOR, COMPRADOR
    descripcion VARCHAR(255) NULL,
    nivel_acceso INT NOT NULL DEFAULT 1,
    activo BIT NOT NULL DEFAULT 1
);
GO

-- 2. Tabla: usuarios
IF OBJECT_ID('dbo.usuarios', 'U') IS NULL
CREATE TABLE dbo.usuarios (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    id_rol INT NOT NULL,
    codigo_empleado VARCHAR(20) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,         -- Encriptado BCrypt/SHA256
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion DATETIME NOT NULL DEFAULT GETDATE(),
    ultimo_acceso DATETIME NULL,
    CONSTRAINT FK_usuarios_roles FOREIGN KEY (id_rol) REFERENCES dbo.roles(id_rol)
);
GO

-- 3. Tabla: socios_negocio (Clientes y Proveedores)
IF OBJECT_ID('dbo.socios_negocio', 'U') IS NULL
CREATE TABLE dbo.socios_negocio (
    id_socio INT IDENTITY(1,1) PRIMARY KEY,
    codigo_socio VARCHAR(20) NOT NULL UNIQUE,    -- Ej: CLI-20556789023 / PRV-20998877665
    tipo_socio CHAR(1) NOT NULL CHECK (tipo_socio IN ('C', 'S')), -- C: Cliente, S: Proveedor
    tipo_documento VARCHAR(10) NOT NULL DEFAULT 'RUC',
    numero_documento VARCHAR(20) NOT NULL UNIQUE, -- RUC (11) o DNI (8)
    razon_social VARCHAR(200) NOT NULL,
    direccion VARCHAR(255) NULL,
    telefono VARCHAR(20) NULL,
    correo VARCHAR(100) NULL,
    condicion_pago VARCHAR(50) NOT NULL DEFAULT 'CONTADO',
    moneda_defecto VARCHAR(3) NOT NULL DEFAULT 'PEN',
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    estado_sync VARCHAR(20) NOT NULL DEFAULT 'SINCRONIZADO',
    fecha_creacion DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 4. Tabla: productos (Catálogo e Inventario)
IF OBJECT_ID('dbo.productos', 'U') IS NULL
CREATE TABLE dbo.productos (
    id_producto INT IDENTITY(1,1) PRIMARY KEY,
    codigo_producto VARCHAR(50) NOT NULL UNIQUE, -- Ej: ART-001
    nombre_producto VARCHAR(200) NOT NULL,
    categoria VARCHAR(100) NOT NULL DEFAULT 'Tecnología',
    unidad_medida VARCHAR(10) NOT NULL DEFAULT 'NIU',
    precio_compra DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    precio_venta DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    stock_actual DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    stock_minimo DECIMAL(12,2) NOT NULL DEFAULT 5.00,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- 5. Tabla: documentos_comerciales (Cabecera de Cotización, Pedido, Guía, Factura, Orden de Compra)
IF OBJECT_ID('dbo.documentos_comerciales', 'U') IS NULL
CREATE TABLE dbo.documentos_comerciales (
    id_documento INT IDENTITY(1001,1) PRIMARY KEY,
    nro_transaccion_ext INT NULL,                -- N° de registro externo / migración
    serie_correlativo VARCHAR(25) NOT NULL,      -- COT-0001001, ORD-0001002, T001-0001003, F001-0001004, POD-0001005
    tipo_documento VARCHAR(25) NOT NULL,         -- COTIZACION, PEDIDO, GUIA_REMISION, FACTURA, ORDEN_COMPRA, ENTRADA_MERCADERIA, FACTURA_PROVEEDOR
    id_socio INT NOT NULL,
    id_usuario_creador INT NOT NULL,
    fecha_emision DATETIME NOT NULL DEFAULT GETDATE(),      -- Fecha de Registro
    fecha_vencimiento DATETIME NOT NULL,                    -- Válido Hasta / Fecha Entrega
    fecha_documento DATETIME NOT NULL DEFAULT GETDATE(),    -- Fecha de Emisión
    moneda VARCHAR(3) NOT NULL DEFAULT 'PEN',
    tipo_cambio DECIMAL(10,4) NOT NULL DEFAULT 3.7500,
    condicion_pago VARCHAR(50) NOT NULL DEFAULT 'CONTADO',
    id_vendedor INT NOT NULL DEFAULT 1,
    nro_referencia_cliente VARCHAR(50) NULL,
    direccion_entrega VARCHAR(255) NULL,
    transportista VARCHAR(150) NULL,
    id_documento_base INT NULL,                  -- Vínculo con el documento anterior (Cotización -> Pedido -> Guía -> Factura)
    serie_documento_base VARCHAR(25) NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    impuesto_igv DECIMAL(12,2) NOT NULL,
    monto_total DECIMAL(12,2) NOT NULL,
    estado_proceso VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_SINCRONIZACION',
    estado_flujo VARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
    observaciones TEXT NULL,
    CONSTRAINT FK_documentos_socio FOREIGN KEY (id_socio) REFERENCES dbo.socios_negocio(id_socio),
    CONSTRAINT FK_documentos_usuario FOREIGN KEY (id_usuario_creador) REFERENCES dbo.usuarios(id_usuario)
);
GO

-- 6. Tabla: detalle_documento (Líneas de cada operación comercial)
IF OBJECT_ID('dbo.detalle_documento', 'U') IS NULL
CREATE TABLE dbo.detalle_documento (
    id_detalle INT IDENTITY(1,1) PRIMARY KEY,
    id_documento INT NOT NULL,
    num_linea INT NOT NULL,
    codigo_producto VARCHAR(50) NOT NULL,
    descripcion_item VARCHAR(250) NOT NULL,
    cantidad DECIMAL(12,4) NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(12,4) NOT NULL,
    porcentaje_descuento DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tipo_impuesto VARCHAR(10) NOT NULL DEFAULT 'IGV', -- IGV (18%), EXO (0%), INA (0%)
    unidad_medida VARCHAR(10) NOT NULL DEFAULT 'NIU',
    id_almacen VARCHAR(10) NOT NULL DEFAULT 'ALM01',
    id_documento_base INT NULL,
    num_linea_base INT NULL,
    monto_linea DECIMAL(12,2) NOT NULL,
    CONSTRAINT FK_detalle_documento FOREIGN KEY (id_documento) REFERENCES dbo.documentos_comerciales(id_documento),
    CONSTRAINT FK_detalle_producto FOREIGN KEY (codigo_producto) REFERENCES dbo.productos(codigo_producto)
);
GO

-- 7. Tabla: logs_sincronizacion (Auditoría y Migración de Transacciones)
IF OBJECT_ID('dbo.logs_sincronizacion', 'U') IS NULL
CREATE TABLE dbo.logs_sincronizacion (
    id_log INT IDENTITY(1,1) PRIMARY KEY,
    id_documento INT NOT NULL,
    tipo_documento VARCHAR(25) NOT NULL,
    entidad_destino VARCHAR(50) NOT NULL,
    tipo_operacion VARCHAR(30) NOT NULL,
    fecha_ejecucion DATETIME NOT NULL DEFAULT GETDATE(),
    estado VARCHAR(30) NOT NULL,
    nro_transaccion_ext INT NULL,
    codigo_error INT NULL,
    mensaje_respuesta TEXT NULL,
    payload_json TEXT NULL,
    CONSTRAINT FK_logs_documento FOREIGN KEY (id_documento) REFERENCES dbo.documentos_comerciales(id_documento)
);
GO

-- ==========================================================================================
-- PARTE 2: PROCEDIMIENTOS ALMACENADOS (STORED PROCEDURES) PARA CONECTAR CON EL BACKEND .NET
-- ==========================================================================================

-- SP 01: Validar Login de Usuario y Registrar Último Acceso
CREATE OR ALTER PROCEDURE dbo.sp_ValidarLoginUsuario
    @email VARCHAR(150)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.usuarios SET ultimo_acceso = GETDATE() WHERE email = @email;

    SELECT 
        u.id_usuario AS IdUsuario,
        u.codigo_empleado AS CodigoEmpleado,
        u.nombres AS Nombres,
        u.apellidos AS Apellidos,
        u.email AS Email,
        u.password_hash AS PasswordHash,
        u.estado AS Estado,
        u.id_rol AS IdRol,
        r.nombre_rol AS NombreRol,
        u.fecha_creacion AS FechaCreacion,
        u.ultimo_acceso AS UltimoAcceso
    FROM dbo.usuarios u
    INNER JOIN dbo.roles r ON u.id_rol = r.id_rol
    WHERE u.email = @email;
END
GO

-- SP 02: Listar Usuarios con su Rol
CREATE OR ALTER PROCEDURE dbo.sp_ListarUsuarios
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        u.id_usuario AS IdUsuario,
        u.codigo_empleado AS CodigoEmpleado,
        u.nombres AS Nombres,
        u.apellidos AS Apellidos,
        u.email AS Email,
        u.password_hash AS PasswordHash,
        u.estado AS Estado,
        u.id_rol AS IdRol,
        r.nombre_rol AS NombreRol,
        u.fecha_creacion AS FechaCreacion,
        u.ultimo_acceso AS UltimoAcceso
    FROM dbo.usuarios u
    INNER JOIN dbo.roles r ON u.id_rol = r.id_rol
    ORDER BY u.id_usuario ASC;
END
GO

-- SP 03: Registrar Nuevo Usuario
CREATE OR ALTER PROCEDURE dbo.sp_RegistrarUsuario
    @codigo_empleado VARCHAR(20),
    @nombres VARCHAR(100),
    @apellidos VARCHAR(100),
    @email VARCHAR(150),
    @password_hash VARCHAR(255),
    @id_rol INT,
    @estado VARCHAR(20) = 'ACTIVO'
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.usuarios (id_rol, codigo_empleado, nombres, apellidos, email, password_hash, estado, fecha_creacion)
    VALUES (@id_rol, @codigo_empleado, @nombres, @apellidos, @email, @password_hash, @estado, GETDATE());

    SELECT SCOPE_IDENTITY() AS IdUsuarioGenerado;
END
GO

-- SP 04: Cambiar Estado de Usuario (Activo / Inactivo)
CREATE OR ALTER PROCEDURE dbo.sp_CambiarEstadoUsuario
    @id_usuario INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.usuarios
    SET estado = CASE WHEN estado = 'ACTIVO' THEN 'INACTIVO' ELSE 'ACTIVO' END
    WHERE id_usuario = @id_usuario;
END
GO

-- SP 05: Listar Roles
CREATE OR ALTER PROCEDURE dbo.sp_ListarRoles
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_rol AS IdRol, nombre_rol AS NombreRol, descripcion AS Descripcion, nivel_acceso AS NivelAcceso, activo AS Activo
    FROM dbo.roles;
END
GO

-- SP 06: Listar Socios de Negocio (Clientes / Proveedores)
CREATE OR ALTER PROCEDURE dbo.sp_ListarSociosNegocio
    @tipo_socio CHAR(1) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        id_socio AS IdSocio,
        codigo_socio AS CardCodeSap,
        tipo_socio AS CardType,
        tipo_documento AS TipoDocumento,
        numero_documento AS LicTradNum,
        razon_social AS RazonSocial,
        direccion AS Direccion,
        telefono AS Telefono,
        correo AS Correo,
        condicion_pago AS CondicionPago,
        moneda_defecto AS MonedaDefecto,
        estado AS Estado,
        estado_sync AS EstadoSync,
        fecha_creacion AS FechaCreacion
    FROM dbo.socios_negocio
    WHERE (@tipo_socio IS NULL OR tipo_socio = @tipo_socio)
    ORDER BY id_socio ASC;
END
GO

-- SP 07: Registrar Cliente o Proveedor
CREATE OR ALTER PROCEDURE dbo.sp_RegistrarSocioNegocio
    @codigo_socio VARCHAR(20),
    @tipo_socio CHAR(1),
    @tipo_documento VARCHAR(10),
    @numero_documento VARCHAR(20),
    @razon_social VARCHAR(200),
    @direccion VARCHAR(255),
    @telefono VARCHAR(20),
    @correo VARCHAR(100),
    @condicion_pago VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.socios_negocio (codigo_socio, tipo_socio, tipo_documento, numero_documento, razon_social, direccion, telefono, correo, condicion_pago, estado, estado_sync)
    VALUES (@codigo_socio, @tipo_socio, @tipo_documento, @numero_documento, @razon_social, @direccion, @telefono, @correo, @condicion_pago, 'ACTIVO', 'SINCRONIZADO');

    SELECT SCOPE_IDENTITY() AS IdSocioGenerado;
END
GO

-- SP 08: Actualizar Cliente o Proveedor
CREATE OR ALTER PROCEDURE dbo.sp_ActualizarSocioNegocio
    @id_socio INT,
    @codigo_socio VARCHAR(20),
    @tipo_socio CHAR(1),
    @numero_documento VARCHAR(20),
    @razon_social VARCHAR(200),
    @direccion VARCHAR(255),
    @telefono VARCHAR(20),
    @correo VARCHAR(100),
    @condicion_pago VARCHAR(50),
    @estado VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.socios_negocio
    SET codigo_socio = @codigo_socio,
        tipo_socio = @tipo_socio,
        numero_documento = @numero_documento,
        razon_social = @razon_social,
        direccion = @direccion,
        telefono = @telefono,
        correo = @correo,
        condicion_pago = @condicion_pago,
        estado = @estado
    WHERE id_socio = @id_socio;
END
GO

-- SP 09: Listar Productos e Inventario
CREATE OR ALTER PROCEDURE dbo.sp_ListarProductos
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        id_producto AS IdProducto,
        codigo_producto AS ItemCode,
        nombre_producto AS ItemName,
        categoria AS Categoria,
        unidad_medida AS UnidadMedida,
        precio_compra AS PrecioCompra,
        precio_venta AS PrecioReferencial,
        stock_actual AS StockActual,
        stock_minimo AS StockMinimo,
        estado AS Estado
    FROM dbo.productos
    ORDER BY id_producto ASC;
END
GO

-- SP 10: Registrar o Actualizar Producto y Stock
CREATE OR ALTER PROCEDURE dbo.sp_GuardarProducto
    @codigo_producto VARCHAR(50),
    @nombre_producto VARCHAR(200),
    @categoria VARCHAR(100),
    @unidad_medida VARCHAR(10),
    @precio_compra DECIMAL(12,2),
    @precio_venta DECIMAL(12,2),
    @stock_actual DECIMAL(12,2),
    @stock_minimo DECIMAL(12,2),
    @estado VARCHAR(20) = 'ACTIVO'
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM dbo.productos WHERE codigo_producto = @codigo_producto)
    BEGIN
        UPDATE dbo.productos
        SET nombre_producto = @nombre_producto,
            categoria = @categoria,
            unidad_medida = @unidad_medida,
            precio_compra = @precio_compra,
            precio_venta = @precio_venta,
            stock_actual = @stock_actual,
            stock_minimo = @stock_minimo,
            estado = @estado
        WHERE codigo_producto = @codigo_producto;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.productos (codigo_producto, nombre_producto, categoria, unidad_medida, precio_compra, precio_venta, stock_actual, stock_minimo, estado)
        VALUES (@codigo_producto, @nombre_producto, @categoria, @unidad_medida, @precio_compra, @precio_venta, @stock_actual, @stock_minimo, @estado);
    END
END
GO

-- SP 11: Registrar Cabecera de Documento Comercial (Cotización, Pedido, Guía, Factura, Orden de Compra)
CREATE OR ALTER PROCEDURE dbo.sp_RegistrarDocumentoCabecera
    @serie_correlativo VARCHAR(25),
    @tipo_documento VARCHAR(25),
    @id_socio INT,
    @id_usuario_creador INT,
    @fecha_emision DATETIME,
    @fecha_vencimiento DATETIME,
    @fecha_documento DATETIME,
    @moneda VARCHAR(3),
    @tipo_cambio DECIMAL(10,4),
    @condicion_pago VARCHAR(50),
    @id_vendedor INT,
    @nro_referencia_cliente VARCHAR(50),
    @direccion_entrega VARCHAR(255),
    @transportista VARCHAR(150),
    @id_documento_base INT = NULL,
    @serie_documento_base VARCHAR(25) = NULL,
    @subtotal DECIMAL(12,2),
    @impuesto_igv DECIMAL(12,2),
    @monto_total DECIMAL(12,2),
    @observaciones TEXT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Si proviene de un documento base, marcar el documento anterior como CERRADO
    IF @id_documento_base IS NOT NULL AND @id_documento_base > 0
    BEGIN
        UPDATE dbo.documentos_comerciales
        SET estado_flujo = 'CERRADO'
        WHERE id_documento = @id_documento_base;
    END

    INSERT INTO dbo.documentos_comerciales (
        serie_correlativo, tipo_documento, id_socio, id_usuario_creador,
        fecha_emision, fecha_vencimiento, fecha_documento, moneda, tipo_cambio,
        condicion_pago, id_vendedor, nro_referencia_cliente, direccion_entrega,
        transportista, id_documento_base, serie_documento_base,
        subtotal, impuesto_igv, monto_total, estado_proceso, estado_flujo, observaciones
    )
    VALUES (
        @serie_correlativo, @tipo_documento, @id_socio, @id_usuario_creador,
        @fecha_emision, @fecha_vencimiento, @fecha_documento, @moneda, @tipo_cambio,
        @condicion_pago, @id_vendedor, @nro_referencia_cliente, @direccion_entrega,
        @transportista, @id_documento_base, @serie_documento_base,
        @subtotal, @impuesto_igv, @monto_total, 'PENDIENTE_SINCRONIZACION', 'ABIERTO', @observaciones
    );

    SELECT SCOPE_IDENTITY() AS IdDocumentoGenerado;
END
GO

-- SP 12: Registrar Detalle de Documento y Actualizar Stock Automáticamente
CREATE OR ALTER PROCEDURE dbo.sp_RegistrarDocumentoDetalle
    @id_documento INT,
    @tipo_documento VARCHAR(25),
    @num_linea INT,
    @codigo_producto VARCHAR(50),
    @descripcion_item VARCHAR(250),
    @cantidad DECIMAL(12,4),
    @precio_unitario DECIMAL(12,4),
    @porcentaje_descuento DECIMAL(5,2),
    @tipo_impuesto VARCHAR(10),
    @unidad_medida VARCHAR(10),
    @id_almacen VARCHAR(10),
    @id_documento_base INT = NULL,
    @num_linea_base INT = NULL,
    @monto_linea DECIMAL(12,2)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.detalle_documento (
        id_documento, num_linea, codigo_producto, descripcion_item,
        cantidad, precio_unitario, porcentaje_descuento, tipo_impuesto,
        unidad_medida, id_almacen, id_documento_base, num_linea_base, monto_linea
    )
    VALUES (
        @id_documento, @num_linea, @codigo_producto, @descripcion_item,
        @cantidad, @precio_unitario, @porcentaje_descuento, @tipo_impuesto,
        @unidad_medida, @id_almacen, @id_documento_base, @num_linea_base, @monto_linea
    );

    -- Descuento de stock físico en Guía de Remisión (o Factura directa)
    IF @tipo_documento = 'GUIA_REMISION' OR (@tipo_documento = 'FACTURA' AND @id_documento_base IS NULL)
    BEGIN
        UPDATE dbo.productos
        SET stock_actual = stock_actual - @cantidad
        WHERE codigo_producto = @codigo_producto;
    END

    -- Incremento de stock físico en Recepción de Mercadería / Orden de Compra
    IF @tipo_documento = 'ORDEN_COMPRA' OR (@tipo_documento = 'ENTRADA_MERCADERIA' AND @id_documento_base IS NULL)
    BEGIN
        UPDATE dbo.productos
        SET stock_actual = stock_actual + @cantidad
        WHERE codigo_producto = @codigo_producto;
    END
END
GO

-- SP 13: Listar Documentos Comerciales (con filtro por módulo VENTAS o COMPRAS)
CREATE OR ALTER PROCEDURE dbo.sp_ListarDocumentosComerciales
    @modulo VARCHAR(25) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        d.id_documento AS IdDocumento,
        d.nro_transaccion_ext AS DocEntrySap,
        d.serie_correlativo AS SerieCorrelativo,
        d.tipo_documento AS TipoDocumento,
        d.id_socio AS IdSocio,
        s.razon_social AS RazonSocialSocio,
        s.codigo_socio AS CardCodeSocio,
        d.id_usuario_creador AS IdUsuarioCreador,
        d.fecha_emision AS FechaEmision,
        d.fecha_vencimiento AS FechaVencimiento,
        d.fecha_documento AS FechaDocumento,
        d.moneda AS Moneda,
        d.tipo_cambio AS TipoCambio,
        d.condicion_pago AS CondicionPago,
        d.id_vendedor AS SlpCode,
        d.nro_referencia_cliente AS NumAtCard,
        d.direccion_entrega AS DireccionEntrega,
        d.transportista AS Transportista,
        d.id_documento_base AS BaseDocId,
        d.serie_documento_base AS BaseSerieCorrelativo,
        d.subtotal AS Subtotal,
        d.impuesto_igv AS ImpuestoIgv,
        d.monto_total AS MontoTotal,
        d.estado_proceso AS EstadoProceso,
        d.estado_flujo AS EstadoFlujo,
        d.observaciones AS Observaciones
    FROM dbo.documentos_comerciales d
    INNER JOIN dbo.socios_negocio s ON d.id_socio = s.id_socio
    WHERE (@modulo IS NULL)
       OR (@modulo = 'VENTAS' AND d.tipo_documento IN ('COTIZACION', 'PEDIDO', 'GUIA_REMISION', 'FACTURA'))
       OR (@modulo = 'COMPRAS' AND d.tipo_documento IN ('ORDEN_COMPRA', 'ENTRADA_MERCADERIA', 'FACTURA_PROVEEDOR'))
       OR (d.tipo_documento = @modulo)
    ORDER BY d.id_documento DESC;
END
GO

-- SP 14: Registrar y Actualizar Log de Auditoría / Sincronización
CREATE OR ALTER PROCEDURE dbo.sp_GuardarLogSincronizacion
    @id_documento INT,
    @tipo_documento VARCHAR(25),
    @entidad_destino VARCHAR(50),
    @tipo_operacion VARCHAR(30),
    @estado VARCHAR(30),
    @nro_transaccion_ext INT = NULL,
    @codigo_error INT = NULL,
    @mensaje_respuesta TEXT = NULL,
    @payload_json TEXT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.documentos_comerciales
    SET estado_proceso = @estado,
        nro_transaccion_ext = ISNULL(@nro_transaccion_ext, nro_transaccion_ext)
    WHERE id_documento = @id_documento;

    IF EXISTS (SELECT 1 FROM dbo.logs_sincronizacion WHERE id_documento = @id_documento)
    BEGIN
        UPDATE dbo.logs_sincronizacion
        SET estado = @estado,
            nro_transaccion_ext = @nro_transaccion_ext,
            codigo_error = @codigo_error,
            mensaje_respuesta = @mensaje_respuesta,
            fecha_ejecucion = GETDATE(),
            tipo_operacion = @tipo_operacion,
            payload_json = ISNULL(@payload_json, payload_json)
        WHERE id_documento = @id_documento;
    END
    ELSE
    BEGIN
        INSERT INTO dbo.logs_sincronizacion (
            id_documento, tipo_documento, entidad_destino, tipo_operacion,
            fecha_ejecucion, estado, nro_transaccion_ext, codigo_error, mensaje_respuesta, payload_json
        )
        VALUES (
            @id_documento, @tipo_documento, @entidad_destino, @tipo_operacion,
            GETDATE(), @estado, @nro_transaccion_ext, @codigo_error, @mensaje_respuesta, @payload_json
        );
    END
END
GO
