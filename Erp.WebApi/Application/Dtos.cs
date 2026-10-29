namespace Erp.WebApi.Application.Dtos;

public class LoginDto {
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class CrearUsuarioDto {
    public string CodigoEmpleado { get; set; } = string.Empty;
    public string Nombres { get; set; } = string.Empty;
    public string Apellidos { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public int IdRol { get; set; } = 2;
    public string Estado { get; set; } = "ACTIVO";
}

public class CrearPedidoDto {
    public string TipoDocumento { get; set; } = "COTIZACION"; // COTIZACION, PEDIDO, GUIA_REMISION, FACTURA, ORDEN_COMPRA, ENTRADA_MERCADERIA, FACTURA_PROVEEDOR
    public int IdSocio { get; set; }
    public int IdUsuarioCreador { get; set; } = 1;
    public DateTime FechaEmision { get; set; } = DateTime.UtcNow; // DocDate
    public DateTime FechaVencimiento { get; set; } = DateTime.UtcNow.AddDays(30); // DocDueDate
    public DateTime FechaDocumento { get; set; } = DateTime.UtcNow; // TaxDate
    public string Moneda { get; set; } = "PEN"; // DocCur
    public decimal TipoCambio { get; set; } = 3.75m; // DocRate
    public string CondicionPago { get; set; } = "CONTADO"; // GroupNum
    public int SlpCode { get; set; } = 1; // SalesPersonCode
    public string NumAtCard { get; set; } = string.Empty; // Referencia Cliente
    public string DireccionEntrega { get; set; } = string.Empty; // Address2
    public string Transportista { get; set; } = string.Empty; // Datos Guía ODLN
    public int? BaseDocId { get; set; } // Documento origen cuando se usa "Copiar a"
    public string? Observaciones { get; set; }
    public List<DetallePedidoDto> Detalles { get; set; } = new();
}

public class DetallePedidoDto {
    public string ItemCode { get; set; } = string.Empty;
    public string DescripcionItem { get; set; } = string.Empty;
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal PorcentajeDescuento { get; set; }
    public string TaxCode { get; set; } = "IGV"; // IGV, EXO, INA
    public string UnidadMedida { get; set; } = "NIU";
    public string IdAlmacen { get; set; } = "ALM01";
}
