using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Erp.WebApi.Domain.Entities;
using Erp.WebApi.Domain.Interfaces;

namespace Erp.WebApi.Infrastructure.Mocks;

public static class SecurityHelper {
    public static string HashPassword(string plainPassword) {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes("ERP_SALT_2026_" + plainPassword));
        return "$2a$11$" + Convert.ToBase64String(bytes);
    }

    public static bool VerifyPassword(string plainPassword, string storedHash) {
        if (storedHash == plainPassword) return true;
        return storedHash == HashPassword(plainPassword);
    }
}

public class MockUnitOfWork : IUnitOfWork {
    public Task BeginTransactionAsync() => Task.CompletedTask;
    public Task CommitAsync() => Task.CompletedTask;
    public Task RollbackAsync() => Task.CompletedTask;
    public Task<int> SaveChangesAsync() => Task.FromResult(1);
}

public class MockUsuarioRepository : IUsuarioRepository {
    private readonly List<Rol> _roles = new() {
        new Rol { IdRol = 1, NombreRol = "ADMIN", Descripcion = "Administrador General del Sistema", NivelAcceso = 100, Activo = true },
        new Rol { IdRol = 2, NombreRol = "VENDEDOR", Descripcion = "Encargado de Ventas, Cotizaciones y Clientes", NivelAcceso = 50, Activo = true },
        new Rol { IdRol = 3, NombreRol = "COMPRADOR", Descripcion = "Encargado de Compras, Almacén y Proveedores", NivelAcceso = 50, Activo = true }
    };

    private readonly List<Usuario> _usuarios = new() {
        new Usuario {
            IdUsuario = 1,
            CodigoEmpleado = "EMP-001",
            Nombres = "Lorena",
            Apellidos = "Damián Salas",
            Email = "admin@erp.com",
            PasswordHash = SecurityHelper.HashPassword("123456"),
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
            PasswordHash = SecurityHelper.HashPassword("123456"),
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
            PasswordHash = SecurityHelper.HashPassword("123456"),
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
            Email = "integracion@erp.com",
            PasswordHash = SecurityHelper.HashPassword("123456"),
            Estado = "ACTIVO",
            IdRol = 1,
            NombreRol = "ADMIN",
            FechaCreacion = DateTime.UtcNow.AddDays(-20),
            UltimoAcceso = DateTime.UtcNow.AddHours(-1)
        }
    };
    private int _nextId = 5;

    public Task<Usuario?> GetByEmailAsync(string email) {
        return Task.FromResult(_usuarios.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase)));
    }

    public Task<Usuario?> GetByIdAsync(int id) {
        return Task.FromResult(_usuarios.FirstOrDefault(u => u.IdUsuario == id));
    }

    public Task<IEnumerable<Usuario>> GetAllAsync() {
        return Task.FromResult<IEnumerable<Usuario>>(_usuarios);
    }

    public Task AddAsync(Usuario usuario) {
        usuario.IdUsuario = _nextId++;
        var rol = _roles.FirstOrDefault(r => r.IdRol == usuario.IdRol);
        usuario.NombreRol = rol?.NombreRol ?? "VENDEDOR";
        _usuarios.Add(usuario);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(Usuario usuario) {
        var idx = _usuarios.FindIndex(u => u.IdUsuario == usuario.IdUsuario);
        if (idx >= 0) {
            var rol = _roles.FirstOrDefault(r => r.IdRol == usuario.IdRol);
            usuario.NombreRol = rol?.NombreRol ?? usuario.NombreRol;
            _usuarios[idx] = usuario;
        }
        return Task.CompletedTask;
    }

    public Task<IEnumerable<Rol>> GetRolesAsync() {
        return Task.FromResult<IEnumerable<Rol>>(_roles);
    }
}

public class MockSocioNegocioRepository : ISocioNegocioRepository {
    private readonly List<SocioNegocio> _socios = new() {
        new SocioNegocio { IdSocio = 1, CardCodeSap = "C20556789023", CardType = "C", TipoDocumento = "RUC", LicTradNum = "20556789023", RazonSocial = "Comercial Los Andes S.A.C.", Direccion = "Av. Javier Prado Este 2450, San Borja, Lima", Telefono = "987654321", Correo = "compras@losandes.pe", CondicionPago = "FACTURA 30 DIAS", Estado = "ACTIVO", EstadoSync = "SINCRONIZADO" },
        new SocioNegocio { IdSocio = 2, CardCodeSap = "C20123456789", CardType = "C", TipoDocumento = "RUC", LicTradNum = "20123456789", RazonSocial = "Distribuidora Norte S.A.C.", Direccion = "Av. Alfredo Mendiola 3810, Los Olivos, Lima", Telefono = "912345678", Correo = "logistica@distnorte.com.pe", CondicionPago = "CONTADO", Estado = "ACTIVO", EstadoSync = "SINCRONIZADO" },
        new SocioNegocio { IdSocio = 3, CardCodeSap = "C10456789012", CardType = "C", TipoDocumento = "RUC", LicTradNum = "10456789012", RazonSocial = "Inversiones San Martín E.I.R.L.", Direccion = "Jr. de la Unión 840, Cercado de Lima", Telefono = "965777665", Correo = "gerencia@invsanmartin.pe", CondicionPago = "CONTADO", Estado = "ACTIVO", EstadoSync = "SINCRONIZADO" },
        new SocioNegocio { IdSocio = 4, CardCodeSap = "C20543210987", CardType = "C", TipoDocumento = "RUC", LicTradNum = "20543210987", RazonSocial = "Mega Import S.A.C.", Direccion = "Calle Los Negocios 420, Surquillo, Lima", Telefono = "945678912", Correo = "ventas@megaimport.pe", CondicionPago = "FACTURA 15 DIAS", Estado = "ACTIVO", EstadoSync = "SINCRONIZADO" },
        new SocioNegocio { IdSocio = 5, CardCodeSap = "C20665432109", CardType = "C", TipoDocumento = "RUC", LicTradNum = "20665432109", RazonSocial = "Grupo Ferretero Perú S.A.C.", Direccion = "Av. Argentina 1850, Callao", Telefono = "976542310", Correo = "pedidos@grupoferretero.pe", CondicionPago = "CONTADO", Estado = "ACTIVO", EstadoSync = "SINCRONIZADO" },
        new SocioNegocio { IdSocio = 6, CardCodeSap = "P20998877665", CardType = "S", TipoDocumento = "RUC", LicTradNum = "20998877665", RazonSocial = "Proveedor Industrial S.A.C.", Direccion = "Av. Nicolás Ayllón 3120, Ate, Lima", Telefono = "014358900", Correo = "despachos@provindustrial.pe", CondicionPago = "FACTURA 30 DIAS", Estado = "ACTIVO", EstadoSync = "SINCRONIZADO" },
        new SocioNegocio { IdSocio = 7, CardCodeSap = "P20445566778", CardType = "S", TipoDocumento = "RUC", LicTradNum = "20445566778", RazonSocial = "Tecnología Global S.A.", Direccion = "Av. República de Panamá 3540, San Isidro, Lima", Telefono = "012214500", Correo = "corporativo@tecglobal.com.pe", CondicionPago = "FACTURA 45 DIAS", Estado = "ACTIVO", EstadoSync = "SINCRONIZADO" },
        new SocioNegocio { IdSocio = 8, CardCodeSap = "P20334455661", CardType = "S", TipoDocumento = "RUC", LicTradNum = "20334455661", RazonSocial = "Suministros Lima S.A.C.", Direccion = "Av. Colonial 1220, Cercado de Lima", Telefono = "998112233", Correo = "cotizaciones@suministroslima.pe", CondicionPago = "CONTADO", Estado = "ACTIVO", EstadoSync = "SINCRONIZADO" }
    };
    private int _nextId = 9;

    public Task<SocioNegocio?> GetByIdAsync(int id) {
        return Task.FromResult(_socios.FirstOrDefault(s => s.IdSocio == id));
    }

    public Task<SocioNegocio?> GetByRucAsync(string licTradNum) {
        return Task.FromResult(_socios.FirstOrDefault(s => s.LicTradNum == licTradNum));
    }

    public Task<IEnumerable<SocioNegocio>> GetAllAsync(string? cardType = null) {
        var query = _socios.AsEnumerable();
        if (!string.IsNullOrEmpty(cardType))
            query = query.Where(s => s.CardType.Equals(cardType, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(query);
    }

    public Task AddAsync(SocioNegocio socio) {
        socio.IdSocio = _nextId++;
        if (string.IsNullOrWhiteSpace(socio.CardCodeSap)) {
            socio.CardCodeSap = (socio.CardType == "C" ? "C" : "P") + socio.LicTradNum;
        }
        socio.FechaCreacion = DateTime.UtcNow;
        _socios.Add(socio);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(SocioNegocio socio) {
        var idx = _socios.FindIndex(s => s.IdSocio == socio.IdSocio);
        if (idx >= 0) {
            _socios[idx] = socio;
        }
        return Task.CompletedTask;
    }
}

public class MockProductoRepository : IProductoRepository {
    private readonly List<Producto> _productos = new() {
        new Producto { IdProducto = 1, ItemCode = "ART-001", ItemName = "Laptop Lenovo ThinkPad T14 Gen 4", Categoria = "Cómputo", UnidadMedida = "NIU", PrecioCompra = 3600.00m, PrecioReferencial = 4500.00m, StockActual = 32, StockMinimo = 5, Estado = "ACTIVO" },
        new Producto { IdProducto = 2, ItemCode = "ART-002", ItemName = "Monitor Dell UltraSharp 27 4K USB-C", Categoria = "Monitores", UnidadMedida = "NIU", PrecioCompra = 920.00m, PrecioReferencial = 1250.00m, StockActual = 45, StockMinimo = 8, Estado = "ACTIVO" },
        new Producto { IdProducto = 3, ItemCode = "ART-003", ItemName = "Laptop HP ProBook 450 G10 15.6\"", Categoria = "Cómputo", UnidadMedida = "NIU", PrecioCompra = 1650.00m, PrecioReferencial = 2100.00m, StockActual = 28, StockMinimo = 5, Estado = "ACTIVO" },
        new Producto { IdProducto = 4, ItemCode = "ART-004", ItemName = "Mouse Inalámbrico Logitech MX Master 3S", Categoria = "Accesorios", UnidadMedida = "NIU", PrecioCompra = 180.00m, PrecioReferencial = 260.00m, StockActual = 110, StockMinimo = 15, Estado = "ACTIVO" },
        new Producto { IdProducto = 5, ItemCode = "ART-005", ItemName = "Teclado Mecánico Corporativo Keychron K8", Categoria = "Accesorios", UnidadMedida = "NIU", PrecioCompra = 210.00m, PrecioReferencial = 310.00m, StockActual = 65, StockMinimo = 10, Estado = "ACTIVO" },
        new Producto { IdProducto = 6, ItemCode = "ART-006", ItemName = "Impresora Multifuncional Epson EcoTank L5290", Categoria = "Impresión", UnidadMedida = "NIU", PrecioCompra = 750.00m, PrecioReferencial = 1050.00m, StockActual = 4, StockMinimo = 6, Estado = "ACTIVO" },
        new Producto { IdProducto = 7, ItemCode = "ART-007", ItemName = "Servidor Torre Dell PowerEdge T150 Xeon", Categoria = "Infraestructura", UnidadMedida = "NIU", PrecioCompra = 5200.00m, PrecioReferencial = 6800.00m, StockActual = 3, StockMinimo = 5, Estado = "ACTIVO" }
    };
    private int _nextId = 8;

    public Task<Producto?> GetByItemCodeAsync(string itemCode) {
        return Task.FromResult(_productos.FirstOrDefault(p => p.ItemCode.Equals(itemCode, StringComparison.OrdinalIgnoreCase)));
    }

    public Task<IEnumerable<Producto>> GetAllAsync() {
        return Task.FromResult<IEnumerable<Producto>>(_productos);
    }

    public Task AddAsync(Producto producto) {
        producto.IdProducto = _nextId++;
        _productos.Add(producto);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(Producto producto) {
        var idx = _productos.FindIndex(p => p.ItemCode.Equals(producto.ItemCode, StringComparison.OrdinalIgnoreCase) || (producto.IdProducto > 0 && p.IdProducto == producto.IdProducto));
        if (idx >= 0) {
            _productos[idx] = producto;
        }
        return Task.CompletedTask;
    }
}

public class MockDocumentoRepository : IDocumentoRepository {
    private readonly List<DocumentoComercial> _documentos;
    private int _nextId = 1006;

    public MockDocumentoRepository() {
        _documentos = new List<DocumentoComercial> {
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
                DocEntrySap = null,
                DocNumSap = null,
                SerieCorrelativo = "POD-000872",
                TipoDocumento = "ORDEN_COMPRA",
                IdSocio = 6,
                RazonSocialSocio = "Proveedor Industrial S.A.C.",
                CardCodeSocio = "P20998877665",
                IdUsuarioCreador = 3,
                FechaEmision = DateTime.UtcNow.AddDays(-4),
                FechaVencimiento = DateTime.UtcNow.AddDays(26),
                Moneda = "PEN",
                TipoCambio = 3.75m,
                Subtotal = 9200.00m,
                ImpuestoIgv = 1656.00m,
                MontoTotal = 10856.00m,
                EstadoProceso = "ERROR_SINCRONIZACION",
                Observaciones = "Reposición de stock mensual de monitores",
                Detalles = new List<DetalleDocumento> {
                    new DetalleDocumento { IdDetalle = 2, IdDocumento = 1002, LineNum = 1, ItemCode = "ART-002", DescripcionItem = "Monitor Dell UltraSharp 27 4K USB-C", Cantidad = 10, PrecioUnitario = 920.00m, PorcentajeDescuento = 0, IdAlmacen = "ALM01", MontoLinea = 9200.00m }
                }
            },
            new DocumentoComercial {
                IdDocumento = 1003,
                DocEntrySap = null,
                DocNumSap = null,
                SerieCorrelativo = "F001-0001246",
                TipoDocumento = "PEDIDO",
                IdSocio = 2,
                RazonSocialSocio = "Distribuidora Norte S.A.C.",
                CardCodeSocio = "C20123456789",
                IdUsuarioCreador = 2,
                FechaEmision = DateTime.UtcNow.AddDays(-2),
                FechaVencimiento = DateTime.UtcNow.AddDays(28),
                Moneda = "PEN",
                TipoCambio = 3.75m,
                Subtotal = 4200.00m,
                ImpuestoIgv = 756.00m,
                MontoTotal = 4956.00m,
                EstadoProceso = "PENDIENTE_SINCRONIZACION",
                Observaciones = "Entrega prioritaria en almacén Los Olivos",
                Detalles = new List<DetalleDocumento> {
                    new DetalleDocumento { IdDetalle = 3, IdDocumento = 1003, LineNum = 1, ItemCode = "ART-003", DescripcionItem = "Laptop HP ProBook 450 G10 15.6\"", Cantidad = 2, PrecioUnitario = 2100.00m, PorcentajeDescuento = 0, IdAlmacen = "ALM01", MontoLinea = 4200.00m }
                }
            },
            new DocumentoComercial {
                IdDocumento = 1004,
                DocEntrySap = 15424,
                DocNumSap = 8001247,
                SerieCorrelativo = "COT-0000412",
                TipoDocumento = "COTIZACION",
                IdSocio = 4,
                RazonSocialSocio = "Mega Import S.A.C.",
                CardCodeSocio = "C20543210987",
                IdUsuarioCreador = 2,
                FechaEmision = DateTime.UtcNow.AddDays(-1),
                FechaVencimiento = DateTime.UtcNow.AddDays(15),
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
    }

    public Task AddAsync(DocumentoComercial documento) {
        documento.IdDocumento = _nextId++;
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
        _documentos.Insert(0, documento);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(DocumentoComercial documento) {
        var idx = _documentos.FindIndex(d => d.IdDocumento == documento.IdDocumento);
        if (idx >= 0) {
            _documentos[idx] = documento;
        }
        return Task.CompletedTask;
    }

    public Task<DocumentoComercial?> GetByIdAsync(int id) {
        return Task.FromResult(_documentos.FirstOrDefault(d => d.IdDocumento == id));
    }

    public Task<IEnumerable<DocumentoComercial>> GetAllAsync(string? tipoDocumento = null) {
        var query = _documentos.AsEnumerable();
        if (!string.IsNullOrEmpty(tipoDocumento)) {
            if (tipoDocumento == "VENTAS") {
                query = query.Where(d => d.TipoDocumento is "COTIZACION" or "PEDIDO" or "GUIA_REMISION" or "FACTURA");
            } else if (tipoDocumento == "COMPRAS") {
                query = query.Where(d => d.TipoDocumento is "ORDEN_COMPRA" or "ENTRADA_MERCADERIA" or "FACTURA_PROVEEDOR");
            } else {
                query = query.Where(d => d.TipoDocumento.Equals(tipoDocumento, StringComparison.OrdinalIgnoreCase));
            }
        }
        return Task.FromResult(query);
    }

    public Task<IEnumerable<DocumentoComercial>> GetPendientesSincronizacionAsync() {
        return Task.FromResult(_documentos.Where(d => d.EstadoProceso == "PENDIENTE_SINCRONIZACION" || d.EstadoProceso == "ERROR_SINCRONIZACION"));
    }
}

public class MockLogSincronizacionRepository : ILogSincronizacionRepository {
    private readonly List<LogSincronizacionSap> _logs = new() {
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
            ErrorMsg = "Transacción confirmada con éxito en base de datos. N° Operación generado: 15423",
            PayloadJson = "{\"codigoSocio\":\"C20556789023\",\"moneda\":\"PEN\",\"detalles\":[{\"codigoProducto\":\"ART-001\",\"cantidad\":2,\"precioUnitario\":4500.00,\"almacen\":\"ALM01\"}]}"
        },
        new LogSincronizacionSap {
            IdLog = 2,
            IdDocumento = 1002,
            TipoDocumento = "ORDEN_COMPRA",
            ObjetoSap = "Compras - Órdenes",
            TipoOperacion = "REGISTRO",
            FechaEjecucion = DateTime.UtcNow.AddDays(-4),
            Estado = "ERROR_SINCRONIZACION",
            DocEntrySap = null,
            ErrorCode = -5002,
            ErrorMsg = "Observación: Período contable requiere validación de jefatura o actualización de tipo de cambio.",
            PayloadJson = "{\"codigoSocio\":\"P20998877665\",\"moneda\":\"PEN\",\"detalles\":[{\"codigoProducto\":\"ART-002\",\"cantidad\":10,\"precioUnitario\":920.00,\"almacen\":\"ALM01\"}]}"
        },
        new LogSincronizacionSap {
            IdLog = 3,
            IdDocumento = 1003,
            TipoDocumento = "PEDIDO",
            ObjetoSap = "Ventas - Pedidos",
            TipoOperacion = "PENDIENTE",
            FechaEjecucion = DateTime.UtcNow.AddDays(-2),
            Estado = "PENDIENTE_SINCRONIZACION",
            DocEntrySap = null,
            ErrorCode = null,
            ErrorMsg = "Documento registrado y pendiente de confirmación de despacho.",
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
            DocEntrySap = 15424,
            ErrorCode = 0,
            ErrorMsg = "Cotización comercial confirmada en el sistema. N° Operación: 15424",
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
    };
    private int _nextId = 6;

    public Task AddAsync(LogSincronizacionSap log) {
        log.IdLog = _nextId++;
        _logs.Insert(0, log);
        return Task.CompletedTask;
    }

    public Task UpdateAsync(LogSincronizacionSap log) {
        var idx = _logs.FindIndex(l => l.IdLog == log.IdLog || l.IdDocumento == log.IdDocumento);
        if (idx >= 0) {
            _logs[idx] = log;
        }
        return Task.CompletedTask;
    }

    public Task<LogSincronizacionSap?> GetByDocumentoIdAsync(int idDocumento) {
        return Task.FromResult(_logs.FirstOrDefault(l => l.IdDocumento == idDocumento));
    }

    public Task<IEnumerable<LogSincronizacionSap>> GetAllAsync() {
        return Task.FromResult<IEnumerable<LogSincronizacionSap>>(_logs);
    }
}
