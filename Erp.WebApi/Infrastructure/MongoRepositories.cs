using Erp.WebApi.Domain.Entities;
using Erp.WebApi.Domain.Interfaces;
using Erp.WebApi.Infrastructure.Mocks;
using MongoDB.Driver;

namespace Erp.WebApi.Infrastructure.Mongo;

public class MongoDbContext {
    private readonly IMongoDatabase _database;

    public IMongoCollection<Rol> Roles => _database.GetCollection<Rol>("roles");
    public IMongoCollection<Usuario> Usuarios => _database.GetCollection<Usuario>("usuarios");
    public IMongoCollection<SocioNegocio> SociosNegocio => _database.GetCollection<SocioNegocio>("socios_negocio");
    public IMongoCollection<Producto> Productos => _database.GetCollection<Producto>("productos");
    public IMongoCollection<DocumentoComercial> DocumentosComerciales => _database.GetCollection<DocumentoComercial>("documentos_comerciales");
    public IMongoCollection<DetalleDocumento> DetallesDocumento => _database.GetCollection<DetalleDocumento>("detalle_documento");
    public IMongoCollection<LogSincronizacionSap> LogsSincronizacion => _database.GetCollection<LogSincronizacionSap>("logs_sincronizacion");

    public MongoDbContext(IConfiguration configuration) {
        var connectionString = configuration.GetConnectionString("MongoDb") ?? "mongodb://localhost:27017";
        var databaseName = configuration["MongoDbSettings:DatabaseName"] ?? "ERP_Comercial_DB";

        var client = new MongoClient(connectionString);
        _database = client.GetDatabase(databaseName);

        SeedDataIfEmpty();
    }

    private void SeedDataIfEmpty() {
        try {
            // 1. Roles
            var existingRoles = Roles.Find(_ => true).ToList();
            if (existingRoles.Count < 3 || existingRoles.Any(r => r.IdRol == 0 || string.IsNullOrEmpty(r.NombreRol))) {
                _database.DropCollection("roles");
                Roles.InsertMany(new List<Rol> {
                    new Rol { IdRol = 1, NombreRol = "ADMIN", Descripcion = "Administrador General del Sistema", NivelAcceso = 100, Activo = true },
                    new Rol { IdRol = 2, NombreRol = "VENDEDOR", Descripcion = "Encargado de Ventas, Cotizaciones y Clientes", NivelAcceso = 50, Activo = true },
                    new Rol { IdRol = 3, NombreRol = "COMPRADOR", Descripcion = "Encargado de Compras, Almacén y Proveedores", NivelAcceso = 50, Activo = true }
                });
            }

            // 2. Usuarios
            var existingUsers = Usuarios.Find(_ => true).ToList();
            var expectedHash = SecurityHelper.HashPassword("123456");
            if (existingUsers.Count < 3 || existingUsers.Any(u => u.IdUsuario == 0 || string.IsNullOrEmpty(u.Email))) {
                _database.DropCollection("usuarios");
                Usuarios.InsertMany(new List<Usuario> {
                    new Usuario {
                        IdUsuario = 1,
                        CodigoEmpleado = "EMP-001",
                        Nombres = "Lorena",
                        Apellidos = "Damián Salas",
                        Email = "admin@erp.com",
                        PasswordHash = expectedHash,
                        Estado = "ACTIVO",
                        IdRol = 1,
                        NombreRol = "ADMIN",
                        FechaCreacion = DateTime.UtcNow.AddMonths(-2),
                        UltimoAcceso = DateTime.UtcNow
                    },
                    new Usuario {
                        IdUsuario = 2,
                        CodigoEmpleado = "EMP-002",
                        Nombres = "Juan Abel",
                        Apellidos = "Huaman Rafael",
                        Email = "ventas@erp.com",
                        PasswordHash = expectedHash,
                        Estado = "ACTIVO",
                        IdRol = 2,
                        NombreRol = "VENDEDOR",
                        FechaCreacion = DateTime.UtcNow.AddMonths(-1),
                        UltimoAcceso = DateTime.UtcNow.AddHours(-3)
                    },
                    new Usuario {
                        IdUsuario = 3,
                        CodigoEmpleado = "EMP-003",
                        Nombres = "Daniel Alejandro",
                        Apellidos = "Pardo Huancahuari",
                        Email = "compras@erp.com",
                        PasswordHash = expectedHash,
                        Estado = "ACTIVO",
                        IdRol = 3,
                        NombreRol = "COMPRADOR",
                        FechaCreacion = DateTime.UtcNow.AddMonths(-1),
                        UltimoAcceso = DateTime.UtcNow.AddHours(-5)
                    },
                    new Usuario {
                        IdUsuario = 4,
                        CodigoEmpleado = "EMP-004",
                        Nombres = "Gustavo Alonso",
                        Apellidos = "Villarreal Calle",
                        Email = "auditoria@erp.com",
                        PasswordHash = expectedHash,
                        Estado = "ACTIVO",
                        IdRol = 1,
                        NombreRol = "ADMIN",
                        FechaCreacion = DateTime.UtcNow.AddDays(-20),
                        UltimoAcceso = DateTime.UtcNow.AddHours(-1)
                    }
                });
            } else {
                // Asegurar que los usuarios demo tengan el hash compatible con '123456'
                foreach (var demoEmail in new[] { "admin@erp.com", "ventas@erp.com", "compras@erp.com" }) {
                    var u = existingUsers.FirstOrDefault(x => x.Email.Equals(demoEmail, StringComparison.OrdinalIgnoreCase));
                    if (u != null && !SecurityHelper.VerifyPassword("123456", u.PasswordHash)) {
                        var update = Builders<Usuario>.Update.Set(x => x.PasswordHash, expectedHash);
                        Usuarios.UpdateOne(x => x.Email == u.Email, update);
                    }
                }
            }

            // 3. Socios de Negocio (Clientes y Proveedores)
            var existingSocios = SociosNegocio.Find(_ => true).ToList();
            if (existingSocios.Count < 5 || existingSocios.Any(s => s.IdSocio == 0 || string.IsNullOrEmpty(s.CardCodeSap) || (s.CardType != "C" && s.CardType != "S"))) {
                _database.DropCollection("socios_negocio");
                SociosNegocio.InsertMany(new List<SocioNegocio> {
                    new SocioNegocio { IdSocio = 1, CardCodeSap = "C20556789023", CardType = "C", TipoDocumento = "RUC", LicTradNum = "20556789023", RazonSocial = "Comercial Los Andes S.A.C.", Direccion = "Av. Javier Prado Este 2450, San Borja, Lima", Telefono = "987654321", Correo = "compras@losandes.pe", CondicionPago = "FACTURA 30 DIAS", Estado = "ACTIVO", EstadoSync = "SINCRONIZADO" },
                    new SocioNegocio { IdSocio = 2, CardCodeSap = "C20123456789", CardType = "C", TipoDocumento = "RUC", LicTradNum = "20123456789", RazonSocial = "Distribuidora Norte S.A.C.", Direccion = "Av. Alfredo Mendiola 3810, Los Olivos, Lima", Telefono = "912345678", Correo = "logistica@distnorte.com.pe", CondicionPago = "CONTADO", Estado = "ACTIVO", EstadoSync = "SINCRONIZADO" },
                    new SocioNegocio { IdSocio = 3, CardCodeSap = "C10456789012", CardType = "C", TipoDocumento = "RUC", LicTradNum = "10456789012", RazonSocial = "Inversiones San Martín E.I.R.L.", Direccion = "Jr. de la Unión 840, Cercado de Lima", Telefono = "965777665", Correo = "gerencia@invsanmartin.pe", CondicionPago = "CONTADO", Estado = "ACTIVO", EstadoSync = "SINCRONIZADO" },
                    new SocioNegocio { IdSocio = 4, CardCodeSap = "C20543210987", CardType = "C", TipoDocumento = "RUC", LicTradNum = "20543210987", RazonSocial = "Mega Import S.A.C.", Direccion = "Calle Los Negocios 420, Surquillo, Lima", Telefono = "945678912", Correo = "ventas@megaimport.pe", CondicionPago = "FACTURA 15 DIAS", Estado = "ACTIVO", EstadoSync = "SINCRONIZADO" },
                    new SocioNegocio { IdSocio = 5, CardCodeSap = "C20665432109", CardType = "C", TipoDocumento = "RUC", LicTradNum = "20665432109", RazonSocial = "Grupo Ferretero Perú S.A.C.", Direccion = "Av. Argentina 1850, Callao", Telefono = "976542310", Correo = "pedidos@grupoferretero.pe", CondicionPago = "CONTADO", Estado = "ACTIVO", EstadoSync = "SINCRONIZADO" },
                    new SocioNegocio { IdSocio = 6, CardCodeSap = "P20998877665", CardType = "S", TipoDocumento = "RUC", LicTradNum = "20998877665", RazonSocial = "Proveedor Industrial S.A.C.", Direccion = "Av. Nicolás Ayllón 3120, Ate, Lima", Telefono = "014358900", Correo = "despachos@provindustrial.pe", CondicionPago = "FACTURA 30 DIAS", Estado = "ACTIVO", EstadoSync = "SINCRONIZADO" },
                    new SocioNegocio { IdSocio = 7, CardCodeSap = "P20445566778", CardType = "S", TipoDocumento = "RUC", LicTradNum = "20445566778", RazonSocial = "Tecnología Global S.A.", Direccion = "Av. República de Panamá 3540, San Isidro, Lima", Telefono = "012214500", Correo = "corporativo@tecglobal.com.pe", CondicionPago = "FACTURA 45 DIAS", Estado = "ACTIVO", EstadoSync = "SINCRONIZADO" },
                    new SocioNegocio { IdSocio = 8, CardCodeSap = "P20334455661", CardType = "S", TipoDocumento = "RUC", LicTradNum = "20334455661", RazonSocial = "Suministros Lima S.A.C.", Direccion = "Av. Colonial 1220, Cercado de Lima", Telefono = "998112233", Correo = "cotizaciones@suministroslima.pe", CondicionPago = "CONTADO", Estado = "ACTIVO", EstadoSync = "SINCRONIZADO" }
                });
            }

            // 4. Productos
            var existingProductos = Productos.Find(_ => true).ToList();
            if (existingProductos.Count < 7 || existingProductos.All(p => string.IsNullOrEmpty(p.ItemCode))) {
                _database.DropCollection("productos");
                Productos.InsertMany(new List<Producto> {
                    new Producto { IdProducto = 1, ItemCode = "ART-001", ItemName = "Laptop Lenovo ThinkPad T14 Gen 4", Categoria = "Cómputo", UnidadMedida = "NIU", PrecioCompra = 3600.00m, PrecioReferencial = 4500.00m, StockActual = 32, StockMinimo = 5, Estado = "ACTIVO" },
                    new Producto { IdProducto = 2, ItemCode = "ART-002", ItemName = "Monitor Dell UltraSharp 27 4K USB-C", Categoria = "Monitores", UnidadMedida = "NIU", PrecioCompra = 920.00m, PrecioReferencial = 1250.00m, StockActual = 45, StockMinimo = 8, Estado = "ACTIVO" },
                    new Producto { IdProducto = 3, ItemCode = "ART-003", ItemName = "Laptop HP ProBook 450 G10 15.6\"", Categoria = "Cómputo", UnidadMedida = "NIU", PrecioCompra = 1650.00m, PrecioReferencial = 2100.00m, StockActual = 28, StockMinimo = 5, Estado = "ACTIVO" },
                    new Producto { IdProducto = 4, ItemCode = "ART-004", ItemName = "Mouse Inalámbrico Logitech MX Master 3S", Categoria = "Accesorios", UnidadMedida = "NIU", PrecioCompra = 180.00m, PrecioReferencial = 260.00m, StockActual = 110, StockMinimo = 15, Estado = "ACTIVO" },
                    new Producto { IdProducto = 5, ItemCode = "ART-005", ItemName = "Teclado Mecánico Corporativo Keychron K8", Categoria = "Accesorios", UnidadMedida = "NIU", PrecioCompra = 210.00m, PrecioReferencial = 310.00m, StockActual = 65, StockMinimo = 10, Estado = "ACTIVO" },
                    new Producto { IdProducto = 6, ItemCode = "ART-006", ItemName = "Impresora Multifuncional Epson EcoTank L5290", Categoria = "Impresión", UnidadMedida = "NIU", PrecioCompra = 750.00m, PrecioReferencial = 1050.00m, StockActual = 4, StockMinimo = 6, Estado = "ACTIVO" },
                    new Producto { IdProducto = 7, ItemCode = "ART-007", ItemName = "Servidor Torre Dell PowerEdge T150 Xeon", Categoria = "Infraestructura", UnidadMedida = "NIU", PrecioCompra = 5200.00m, PrecioReferencial = 6800.00m, StockActual = 3, StockMinimo = 5, Estado = "ACTIVO" }
                });
            }

            // 5 y 6. Documentos Comerciales y Detalle Documento
            var existingDocs = DocumentosComerciales.Find(_ => true).ToList();
            if (existingDocs.Count < 3 || existingDocs.Any(d => d.IdSocio == 0 || string.IsNullOrEmpty(d.RazonSocialSocio))) {
                _database.DropCollection("documentos_comerciales");
                _database.DropCollection("detalle_documento");

                var seedDocs = new List<DocumentoComercial> {
                    new DocumentoComercial {
                        IdDocumento = 1001,
                        DocEntrySap = 15423,
                        DocNumSap = 8001245,
                        SerieCorrelativo = "F001-0001245",
                        TipoDocumento = "PEDIDO",
                        IdSocio = 1,
                        RazonSocialSocio = "Comercial Los Andes S.A.C.",
                        CardCodeSocio = "C20556789023",
                        IdUsuarioCreador = 1,
                        FechaEmision = DateTime.UtcNow.AddDays(-5),
                        FechaVencimiento = DateTime.UtcNow.AddDays(25),
                        CondicionPago = "FACTURA 30 DIAS",
                        Moneda = "PEN",
                        TipoCambio = 3.75m,
                        Subtotal = 9000.00m,
                        ImpuestoIgv = 1620.00m,
                        MontoTotal = 10620.00m,
                        EstadoProceso = "SINCRONIZADO",
                        Observaciones = "Equipamiento de oficinas sede San Borja",
                        Detalles = new List<DetalleDocumento> {
                            new DetalleDocumento { IdDetalle = 1, IdDocumento = 1001, LineNum = 1, ItemCode = "ART-001", DescripcionItem = "Laptop Lenovo ThinkPad T14 Gen 4", Cantidad = 2, PrecioUnitario = 4500.00m, PorcentajeDescuento = 0, IdAlmacen = "ALM01", MontoLinea = 9000.00m }
                        }
                    },
                    new DocumentoComercial {
                        IdDocumento = 1002,
                        DocEntrySap = 90209,
                        DocNumSap = 4500872,
                        SerieCorrelativo = "POD-000872",
                        TipoDocumento = "ORDEN_COMPRA",
                        IdSocio = 6,
                        RazonSocialSocio = "Proveedor Industrial S.A.C.",
                        CardCodeSocio = "P20998877665",
                        IdUsuarioCreador = 3,
                        FechaEmision = DateTime.UtcNow.AddDays(-4),
                        FechaVencimiento = DateTime.UtcNow.AddDays(26),
                        CondicionPago = "FACTURA 30 DIAS",
                        Moneda = "PEN",
                        TipoCambio = 3.75m,
                        Subtotal = 9200.00m,
                        ImpuestoIgv = 1656.00m,
                        MontoTotal = 10856.00m,
                        EstadoProceso = "SINCRONIZADO",
                        Observaciones = "Reposición de stock mensual de monitores",
                        Detalles = new List<DetalleDocumento> {
                            new DetalleDocumento { IdDetalle = 2, IdDocumento = 1002, LineNum = 1, ItemCode = "ART-002", DescripcionItem = "Monitor Dell UltraSharp 27 4K USB-C", Cantidad = 10, PrecioUnitario = 920.00m, PorcentajeDescuento = 0, IdAlmacen = "ALM01", MontoLinea = 9200.00m }
                        }
                    },
                    new DocumentoComercial {
                        IdDocumento = 1003,
                        DocEntrySap = 15424,
                        DocNumSap = 8001246,
                        SerieCorrelativo = "F001-0001246",
                        TipoDocumento = "PEDIDO",
                        IdSocio = 2,
                        RazonSocialSocio = "Distribuidora Norte S.A.C.",
                        CardCodeSocio = "C20123456789",
                        IdUsuarioCreador = 2,
                        FechaEmision = DateTime.UtcNow.AddDays(-2),
                        FechaVencimiento = DateTime.UtcNow.AddDays(28),
                        CondicionPago = "CONTADO",
                        Moneda = "PEN",
                        TipoCambio = 3.75m,
                        Subtotal = 4200.00m,
                        ImpuestoIgv = 756.00m,
                        MontoTotal = 4956.00m,
                        EstadoProceso = "SINCRONIZADO",
                        Observaciones = "Entrega prioritaria en almacén Los Olivos",
                        Detalles = new List<DetalleDocumento> {
                            new DetalleDocumento { IdDetalle = 3, IdDocumento = 1003, LineNum = 1, ItemCode = "ART-003", DescripcionItem = "Laptop HP ProBook 450 G10 15.6\"", Cantidad = 2, PrecioUnitario = 2100.00m, PorcentajeDescuento = 0, IdAlmacen = "ALM01", MontoLinea = 4200.00m }
                        }
                    },
                    new DocumentoComercial {
                        IdDocumento = 1004,
                        DocEntrySap = 15425,
                        DocNumSap = 8001247,
                        SerieCorrelativo = "COT-0000412",
                        TipoDocumento = "COTIZACION",
                        IdSocio = 4,
                        RazonSocialSocio = "Mega Import S.A.C.",
                        CardCodeSocio = "C20543210987",
                        IdUsuarioCreador = 2,
                        FechaEmision = DateTime.UtcNow.AddDays(-1),
                        FechaVencimiento = DateTime.UtcNow.AddDays(15),
                        CondicionPago = "FACTURA 15 DIAS",
                        Moneda = "PEN",
                        TipoCambio = 3.75m,
                        Subtotal = 2600.00m,
                        ImpuestoIgv = 468.00m,
                        MontoTotal = 3068.00m,
                        EstadoProceso = "SINCRONIZADO",
                        Observaciones = "Cotización corporativa accesorios",
                        Detalles = new List<DetalleDocumento> {
                            new DetalleDocumento { IdDetalle = 4, IdDocumento = 1004, LineNum = 1, ItemCode = "ART-004", DescripcionItem = "Mouse Inalámbrico Logitech MX Master 3S", Cantidad = 10, PrecioUnitario = 260.00m, PorcentajeDescuento = 0, IdAlmacen = "ALM01", MontoLinea = 2600.00m }
                        }
                    },
                    new DocumentoComercial {
                        IdDocumento = 1005,
                        DocEntrySap = 90210,
                        DocNumSap = 4500873,
                        SerieCorrelativo = "POD-000873",
                        TipoDocumento = "ORDEN_COMPRA",
                        IdSocio = 7,
                        RazonSocialSocio = "Tecnología Global S.A.",
                        CardCodeSocio = "P20445566778",
                        IdUsuarioCreador = 3,
                        FechaEmision = DateTime.UtcNow.AddHours(-12),
                        FechaVencimiento = DateTime.UtcNow.AddDays(30),
                        CondicionPago = "FACTURA 45 DIAS",
                        Moneda = "PEN",
                        TipoCambio = 3.75m,
                        Subtotal = 7200.00m,
                        ImpuestoIgv = 1296.00m,
                        MontoTotal = 8496.00m,
                        EstadoProceso = "SINCRONIZADO",
                        Observaciones = "Abastecimiento de portátiles Lenovo",
                        Detalles = new List<DetalleDocumento> {
                            new DetalleDocumento { IdDetalle = 5, IdDocumento = 1005, LineNum = 1, ItemCode = "ART-001", DescripcionItem = "Laptop Lenovo ThinkPad T14 Gen 4", Cantidad = 2, PrecioUnitario = 3600.00m, PorcentajeDescuento = 0, IdAlmacen = "ALM01", MontoLinea = 7200.00m }
                        }
                    }
                };

                DocumentosComerciales.InsertMany(seedDocs);
                DetallesDocumento.InsertMany(seedDocs.SelectMany(d => d.Detalles));
            } else if (DetallesDocumento.CountDocuments(_ => true) == 0) {
                var allDetails = existingDocs.Where(d => d.Detalles != null).SelectMany(d => d.Detalles).ToList();
                if (allDetails.Count > 0) {
                    DetallesDocumento.InsertMany(allDetails);
                }
            }

            // 7. Logs de Auditoría
            var existingLogs = LogsSincronizacion.Find(_ => true).ToList();
            if (existingLogs.Count < 3 || existingLogs.Any(l => l.IdLog == 0 || string.IsNullOrEmpty(l.TipoDocumento))) {
                _database.DropCollection("logs_sincronizacion");
                LogsSincronizacion.InsertMany(new List<LogSincronizacionSap> {
                    new LogSincronizacionSap {
                        IdLog = 1,
                        IdDocumento = 1001,
                        TipoDocumento = "PEDIDO",
                        ObjetoSap = "Ventas - Pedidos",
                        TipoOperacion = "REGISTRO",
                        FechaEjecucion = DateTime.UtcNow.AddDays(-5),
                        Estado = "SINCRONIZADO",
                        DocEntrySap = 15423,
                        ErrorCode = 0,
                        ErrorMsg = "Transacción confirmada con éxito en MongoDB. N° Operación: 15423",
                        PayloadJson = "{\"codigoSocio\":\"C20556789023\",\"moneda\":\"PEN\",\"detalles\":[{\"codigoProducto\":\"ART-001\",\"cantidad\":2,\"precioUnitario\":4500.00,\"almacen\":\"ALM01\"}]}"
                    },
                    new LogSincronizacionSap {
                        IdLog = 2,
                        IdDocumento = 1002,
                        TipoDocumento = "ORDEN_COMPRA",
                        ObjetoSap = "Compras - Órdenes",
                        TipoOperacion = "REGISTRO",
                        FechaEjecucion = DateTime.UtcNow.AddDays(-4),
                        Estado = "SINCRONIZADO",
                        DocEntrySap = 90209,
                        ErrorCode = 0,
                        ErrorMsg = "Orden de Compra registrada y confirmada en MongoDB. N° Operación: 90209",
                        PayloadJson = "{\"codigoSocio\":\"P20998877665\",\"moneda\":\"PEN\",\"detalles\":[{\"codigoProducto\":\"ART-002\",\"cantidad\":10,\"precioUnitario\":920.00,\"almacen\":\"ALM01\"}]}"
                    },
                    new LogSincronizacionSap {
                        IdLog = 3,
                        IdDocumento = 1003,
                        TipoDocumento = "PEDIDO",
                        ObjetoSap = "Ventas - Pedidos",
                        TipoOperacion = "REGISTRO",
                        FechaEjecucion = DateTime.UtcNow.AddDays(-2),
                        Estado = "SINCRONIZADO",
                        DocEntrySap = 15424,
                        ErrorCode = 0,
                        ErrorMsg = "Pedido de Venta registrado en MongoDB. N° Operación: 15424",
                        PayloadJson = "{\"codigoSocio\":\"C20123456789\",\"moneda\":\"PEN\",\"detalles\":[{\"codigoProducto\":\"ART-003\",\"cantidad\":2,\"precioUnitario\":2100.00,\"almacen\":\"ALM01\"}]}"
                    },
                    new LogSincronizacionSap {
                        IdLog = 4,
                        IdDocumento = 1004,
                        TipoDocumento = "COTIZACION",
                        ObjetoSap = "Ventas - Cotizaciones",
                        TipoOperacion = "REGISTRO",
                        FechaEjecucion = DateTime.UtcNow.AddDays(-1),
                        Estado = "SINCRONIZADO",
                        DocEntrySap = 15425,
                        ErrorCode = 0,
                        ErrorMsg = "Cotización comercial confirmada en MongoDB. N° Operación: 15425",
                        PayloadJson = "{\"codigoSocio\":\"C20543210987\",\"moneda\":\"PEN\",\"detalles\":[{\"codigoProducto\":\"ART-004\",\"cantidad\":10,\"precioUnitario\":260.00,\"almacen\":\"ALM01\"}]}"
                    },
                    new LogSincronizacionSap {
                        IdLog = 5,
                        IdDocumento = 1005,
                        TipoDocumento = "ORDEN_COMPRA",
                        ObjetoSap = "Compras - Órdenes",
                        TipoOperacion = "REGISTRO",
                        FechaEjecucion = DateTime.UtcNow.AddHours(-12),
                        Estado = "SINCRONIZADO",
                        DocEntrySap = 90210,
                        ErrorCode = 0,
                        ErrorMsg = "Orden de Compra registrada y confirmada en almacén. N° Operación: 90210",
                        PayloadJson = "{\"codigoSocio\":\"P20445566778\",\"moneda\":\"PEN\",\"detalles\":[{\"codigoProducto\":\"ART-001\",\"cantidad\":2,\"precioUnitario\":3600.00,\"almacen\":\"ALM01\"}]}"
                    }
                });
            }
        } catch (Exception ex) {
            Console.WriteLine($"[MongoDB Seed Warning]: {ex.Message}");
        }
    }
}

public class MongoUsuarioRepository : IUsuarioRepository {
    private readonly MongoDbContext _ctx;

    public MongoUsuarioRepository(MongoDbContext ctx) {
        _ctx = ctx;
    }

    public async Task<Usuario?> GetByEmailAsync(string email) {
        var list = await _ctx.Usuarios.Find(_ => true).ToListAsync();
        return list.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<Usuario?> GetByIdAsync(int id) {
        return await _ctx.Usuarios.Find(u => u.IdUsuario == id).FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<Usuario>> GetAllAsync() {
        return await _ctx.Usuarios.Find(_ => true).SortBy(u => u.IdUsuario).ToListAsync();
    }

    public async Task AddAsync(Usuario usuario) {
        var all = await _ctx.Usuarios.Find(_ => true).ToListAsync();
        usuario.IdUsuario = all.Count > 0 ? all.Max(u => u.IdUsuario) + 1 : 1;

        var roles = await _ctx.Roles.Find(_ => true).ToListAsync();
        var rol = roles.FirstOrDefault(r => r.IdRol == usuario.IdRol);
        usuario.NombreRol = rol?.NombreRol ?? "VENDEDOR";

        await _ctx.Usuarios.InsertOneAsync(usuario);
    }

    public async Task UpdateAsync(Usuario usuario) {
        var roles = await _ctx.Roles.Find(_ => true).ToListAsync();
        var rol = roles.FirstOrDefault(r => r.IdRol == usuario.IdRol);
        usuario.NombreRol = rol?.NombreRol ?? usuario.NombreRol;

        await _ctx.Usuarios.ReplaceOneAsync(u => u.IdUsuario == usuario.IdUsuario, usuario);
    }

    public async Task<IEnumerable<Rol>> GetRolesAsync() {
        return await _ctx.Roles.Find(_ => true).SortBy(r => r.IdRol).ToListAsync();
    }
}

public class MongoSocioNegocioRepository : ISocioNegocioRepository {
    private readonly MongoDbContext _ctx;

    public MongoSocioNegocioRepository(MongoDbContext ctx) {
        _ctx = ctx;
    }

    public async Task<SocioNegocio?> GetByIdAsync(int id) {
        return await _ctx.SociosNegocio.Find(s => s.IdSocio == id).FirstOrDefaultAsync();
    }

    public async Task<SocioNegocio?> GetByRucAsync(string licTradNum) {
        return await _ctx.SociosNegocio.Find(s => s.LicTradNum == licTradNum).FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<SocioNegocio>> GetAllAsync(string? cardType = null) {
        var list = await _ctx.SociosNegocio.Find(_ => true).SortBy(s => s.IdSocio).ToListAsync();
        if (!string.IsNullOrEmpty(cardType)) {
            return list.Where(s => s.CardType.Equals(cardType, StringComparison.OrdinalIgnoreCase));
        }
        return list;
    }

    public async Task AddAsync(SocioNegocio socio) {
        var all = await _ctx.SociosNegocio.Find(_ => true).ToListAsync();
        socio.IdSocio = all.Count > 0 ? all.Max(s => s.IdSocio) + 1 : 1;
        if (string.IsNullOrWhiteSpace(socio.CardCodeSap)) {
            socio.CardCodeSap = (socio.CardType == "C" ? "C" : "P") + socio.LicTradNum;
        }
        socio.FechaCreacion = DateTime.UtcNow;
        await _ctx.SociosNegocio.InsertOneAsync(socio);
    }

    public async Task UpdateAsync(SocioNegocio socio) {
        var existing = await GetByIdAsync(socio.IdSocio);
        if (existing != null) {
            socio.MongoId = existing.MongoId;
        }
        await _ctx.SociosNegocio.ReplaceOneAsync(s => s.IdSocio == socio.IdSocio, socio);
    }
}

public class MongoProductoRepository : IProductoRepository {
    private readonly MongoDbContext _ctx;

    public MongoProductoRepository(MongoDbContext ctx) {
        _ctx = ctx;
    }

    public async Task<Producto?> GetByItemCodeAsync(string itemCode) {
        var list = await _ctx.Productos.Find(_ => true).ToListAsync();
        return list.FirstOrDefault(p => p.ItemCode.Equals(itemCode, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<IEnumerable<Producto>> GetAllAsync() {
        return await _ctx.Productos.Find(_ => true).SortBy(p => p.IdProducto).ToListAsync();
    }

    public async Task AddAsync(Producto producto) {
        var all = await _ctx.Productos.Find(_ => true).ToListAsync();
        producto.IdProducto = all.Count > 0 ? all.Max(p => p.IdProducto) + 1 : 1;
        await _ctx.Productos.InsertOneAsync(producto);
    }

    public async Task UpdateAsync(Producto producto) {
        var existing = await GetByItemCodeAsync(producto.ItemCode);
        if (existing != null) {
            producto.MongoId = existing.MongoId;
            if (producto.IdProducto == 0) producto.IdProducto = existing.IdProducto;
        }
        await _ctx.Productos.ReplaceOneAsync(p => p.ItemCode == producto.ItemCode, producto);
    }
}

public class MongoDocumentoRepository : IDocumentoRepository {
    private readonly MongoDbContext _ctx;

    public MongoDocumentoRepository(MongoDbContext ctx) {
        _ctx = ctx;
    }

    public async Task AddAsync(DocumentoComercial documento) {
        var all = await _ctx.DocumentosComerciales.Find(_ => true).ToListAsync();
        documento.IdDocumento = all.Count > 0 ? all.Max(d => d.IdDocumento) + 1 : 1001;
        documento.EstadoProceso = "SINCRONIZADO";

        if (string.IsNullOrEmpty(documento.SerieCorrelativo)) {
            var prefix = documento.TipoDocumento switch {
                "COTIZACION" => "COT",
                "PEDIDO" => "ORD",
                "GUIA_REMISION" => "T001",
                "FACTURA" => "F001",
                "ORDEN_COMPRA" => "POD",
                "ENTRADA_MERCADERIA" => "GRE",
                "FACTURA_PROVEEDOR" => "FPR",
                _ => "DOC"
            };
            documento.SerieCorrelativo = $"{prefix}-000{documento.IdDocumento}";
        }

        // Asignar IDs a cada línea de detalle y guardar también en la colección detalle_documento
        var existingDetails = await _ctx.DetallesDocumento.Find(_ => true).ToListAsync();
        int nextDetailId = existingDetails.Count > 0 ? existingDetails.Max(x => x.IdDetalle) + 1 : 1;

        foreach (var det in documento.Detalles) {
            det.IdDetalle = nextDetailId++;
            det.IdDocumento = documento.IdDocumento;
        }

        await _ctx.DocumentosComerciales.InsertOneAsync(documento);

        if (documento.Detalles.Count > 0) {
            await _ctx.DetallesDocumento.InsertManyAsync(documento.Detalles);
        }
    }

    public async Task UpdateAsync(DocumentoComercial documento) {
        var existing = await GetByIdAsync(documento.IdDocumento);
        if (existing != null) {
            documento.MongoId = existing.MongoId;
        }
        await _ctx.DocumentosComerciales.ReplaceOneAsync(d => d.IdDocumento == documento.IdDocumento, documento);
    }

    public async Task<DocumentoComercial?> GetByIdAsync(int id) {
        return await _ctx.DocumentosComerciales.Find(d => d.IdDocumento == id).FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<DocumentoComercial>> GetAllAsync(string? tipoDocumento = null) {
        var list = await _ctx.DocumentosComerciales.Find(_ => true).SortByDescending(d => d.IdDocumento).ToListAsync();
        if (!string.IsNullOrEmpty(tipoDocumento)) {
            if (tipoDocumento == "VENTAS") {
                return list.Where(d => d.TipoDocumento is "COTIZACION" or "PEDIDO" or "GUIA_REMISION" or "FACTURA");
            } else if (tipoDocumento == "COMPRAS") {
                return list.Where(d => d.TipoDocumento is "ORDEN_COMPRA" or "ENTRADA_MERCADERIA" or "FACTURA_PROVEEDOR");
            } else {
                return list.Where(d => d.TipoDocumento.Equals(tipoDocumento, StringComparison.OrdinalIgnoreCase));
            }
        }
        return list;
    }

    public async Task<IEnumerable<DocumentoComercial>> GetPendientesSincronizacionAsync() {
        var list = await _ctx.DocumentosComerciales.Find(_ => true).ToListAsync();
        return list.Where(d => d.EstadoProceso == "PENDIENTE_SINCRONIZACION" || d.EstadoProceso == "ERROR_SINCRONIZACION");
    }
}

public class MongoLogSincronizacionRepository : ILogSincronizacionRepository {
    private readonly MongoDbContext _ctx;

    public MongoLogSincronizacionRepository(MongoDbContext ctx) {
        _ctx = ctx;
    }

    public async Task AddAsync(LogSincronizacionSap log) {
        var all = await _ctx.LogsSincronizacion.Find(_ => true).ToListAsync();
        log.IdLog = all.Count > 0 ? all.Max(l => l.IdLog) + 1 : 1;
        log.Estado = "SINCRONIZADO";
        await _ctx.LogsSincronizacion.InsertOneAsync(log);
    }

    public async Task UpdateAsync(LogSincronizacionSap log) {
        var existing = await GetByDocumentoIdAsync(log.IdDocumento);
        if (existing != null) {
            log.MongoId = existing.MongoId;
            if (log.IdLog == 0) log.IdLog = existing.IdLog;
        }
        await _ctx.LogsSincronizacion.ReplaceOneAsync(l => l.IdDocumento == log.IdDocumento, log);
    }

    public async Task<LogSincronizacionSap?> GetByDocumentoIdAsync(int idDocumento) {
        return await _ctx.LogsSincronizacion.Find(l => l.IdDocumento == idDocumento).FirstOrDefaultAsync();
    }

    public async Task<IEnumerable<LogSincronizacionSap>> GetAllAsync() {
        return await _ctx.LogsSincronizacion.Find(_ => true).SortByDescending(l => l.IdLog).ToListAsync();
    }
}
