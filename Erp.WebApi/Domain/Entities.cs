using System.Text.Json.Serialization;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Erp.WebApi.Domain.Entities;

[BsonIgnoreExtraElements]
public class Rol {
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [BsonIgnoreIfDefault]
    [JsonIgnore]
    public string? MongoId { get; set; }

    [BsonElement("id_rol")]
    public int IdRol { get; set; }

    [BsonElement("nombre_rol")]
    public string NombreRol { get; set; } = string.Empty; // ADMIN, VENDEDOR, COMPRADOR

    [BsonElement("descripcion")]
    public string Descripcion { get; set; } = string.Empty;

    [BsonElement("nivel_acceso")]
    public int NivelAcceso { get; set; } = 1;

    [BsonElement("activo")]
    public bool Activo { get; set; } = true;
}

[BsonIgnoreExtraElements]
public class Usuario {
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [BsonIgnoreIfDefault]
    [JsonIgnore]
    public string? MongoId { get; set; }

    [BsonElement("id_usuario")]
    public int IdUsuario { get; set; }

    [BsonElement("codigo_empleado")]
    public string CodigoEmpleado { get; set; } = string.Empty;

    [BsonElement("nombres")]
    public string Nombres { get; set; } = string.Empty;

    [BsonElement("apellidos")]
    public string Apellidos { get; set; } = string.Empty;

    [BsonElement("email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    [BsonElement("estado")]
    public string Estado { get; set; } = "ACTIVO";

    [BsonElement("id_rol")]
    public int IdRol { get; set; }

    [BsonElement("nombre_rol")]
    public string NombreRol { get; set; } = "ADMIN";

    [BsonElement("fecha_creacion")]
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    [BsonElement("ultimo_acceso")]
    public DateTime? UltimoAcceso { get; set; }
}

[BsonIgnoreExtraElements]
public class SocioNegocio {
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [BsonIgnoreIfDefault]
    [JsonIgnore]
    public string? MongoId { get; set; }

    [BsonElement("id_socio")]
    public int IdSocio { get; set; }

    [BsonElement("codigo_socio")]
    public string CardCodeSap { get; set; } = string.Empty;

    [BsonElement("tipo_socio")]
    public string CardType { get; set; } = "C"; // C = Cliente, S = Proveedor

    [BsonElement("tipo_documento")]
    public string TipoDocumento { get; set; } = "RUC"; // RUC, DNI

    [BsonElement("razon_social")]
    public string RazonSocial { get; set; } = string.Empty;

    [BsonElement("numero_documento")]
    public string LicTradNum { get; set; } = string.Empty; // RUC/DNI

    [BsonElement("direccion")]
    public string Direccion { get; set; } = string.Empty;

    [BsonElement("telefono")]
    public string Telefono { get; set; } = string.Empty;

    [BsonElement("correo")]
    public string Correo { get; set; } = string.Empty;

    [BsonElement("condicion_pago")]
    public string CondicionPago { get; set; } = "CONTADO";

    [BsonElement("moneda_defecto")]
    public string MonedaDefecto { get; set; } = "PEN";

    [BsonElement("estado")]
    public string Estado { get; set; } = "ACTIVO";

    [BsonElement("estado_sync")]
    public string EstadoSync { get; set; } = "SINCRONIZADO";

    [BsonElement("fecha_creacion")]
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}

[BsonIgnoreExtraElements]
public class Producto {
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [BsonIgnoreIfDefault]
    [JsonIgnore]
    public string? MongoId { get; set; }

    [BsonElement("id_producto")]
    public int IdProducto { get; set; }

    [BsonElement("codigo_producto")]
    public string ItemCode { get; set; } = string.Empty;

    [BsonElement("nombre_producto")]
    public string ItemName { get; set; } = string.Empty;

    [BsonElement("categoria")]
    public string Categoria { get; set; } = "Tecnología";

    [BsonElement("unidad_medida")]
    public string UnidadMedida { get; set; } = "NIU";

    [BsonElement("precio_compra")]
    public decimal PrecioCompra { get; set; }

    [BsonElement("precio_venta")]
    public decimal PrecioReferencial { get; set; }

    [BsonElement("stock_actual")]
    public decimal StockActual { get; set; }

    [BsonElement("stock_minimo")]
    public decimal StockMinimo { get; set; } = 5;

    [BsonElement("estado")]
    public string Estado { get; set; } = "ACTIVO";
}

[BsonIgnoreExtraElements]
public class DocumentoComercial {
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [BsonIgnoreIfDefault]
    [JsonIgnore]
    public string? MongoId { get; set; }

    [BsonElement("id_documento")]
    public int IdDocumento { get; set; }

    [BsonElement("nro_transaccion_ext")]
    public int? DocEntrySap { get; set; }

    [BsonElement("nro_operacion")]
    public int? DocNumSap { get; set; }

    [BsonElement("serie_correlativo")]
    public string SerieCorrelativo { get; set; } = string.Empty;

    [BsonElement("tipo_documento")]
    public string TipoDocumento { get; set; } = string.Empty;

    [BsonElement("id_socio")]
    public int IdSocio { get; set; }

    [BsonElement("razon_social_socio")]
    public string RazonSocialSocio { get; set; } = string.Empty;

    [BsonElement("codigo_socio")]
    public string CardCodeSocio { get; set; } = string.Empty;

    [BsonElement("id_usuario_creador")]
    public int IdUsuarioCreador { get; set; }

    [BsonElement("fecha_emision")]
    public DateTime FechaEmision { get; set; } = DateTime.UtcNow;

    [BsonElement("fecha_vencimiento")]
    public DateTime FechaVencimiento { get; set; } = DateTime.UtcNow.AddDays(30);

    [BsonElement("fecha_documento")]
    public DateTime FechaDocumento { get; set; } = DateTime.UtcNow;

    [BsonElement("moneda")]
    public string Moneda { get; set; } = "PEN";

    [BsonElement("tipo_cambio")]
    public decimal TipoCambio { get; set; } = 3.75m;

    [BsonElement("condicion_pago")]
    public string CondicionPago { get; set; } = "CONTADO";

    [BsonElement("id_vendedor")]
    public int SlpCode { get; set; } = 1;

    [BsonElement("nro_referencia_cliente")]
    public string NumAtCard { get; set; } = string.Empty;

    [BsonElement("direccion_entrega")]
    public string DireccionEntrega { get; set; } = string.Empty;

    [BsonElement("transportista")]
    public string Transportista { get; set; } = string.Empty;

    [BsonElement("id_documento_base")]
    public int? BaseDocId { get; set; }

    [BsonElement("tipo_documento_base")]
    public int? BaseType { get; set; }

    [BsonElement("serie_documento_base")]
    public string? BaseSerieCorrelativo { get; set; }

    [BsonElement("subtotal")]
    public decimal Subtotal { get; set; }

    [BsonElement("impuesto_igv")]
    public decimal ImpuestoIgv { get; set; }

    [BsonElement("monto_total")]
    public decimal MontoTotal { get; set; }

    [BsonElement("estado_proceso")]
    public string EstadoProceso { get; set; } = "SINCRONIZADO";

    [BsonElement("estado_flujo")]
    public string EstadoFlujo { get; set; } = "ABIERTO";

    [BsonElement("observaciones")]
    public string? Observaciones { get; set; }

    [BsonElement("detalles")]
    public List<DetalleDocumento> Detalles { get; set; } = new();
}

[BsonIgnoreExtraElements]
public class DetalleDocumento {
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [BsonIgnoreIfDefault]
    [JsonIgnore]
    public string? MongoId { get; set; }

    [BsonElement("id_detalle")]
    public int IdDetalle { get; set; }

    [BsonElement("id_documento")]
    public int IdDocumento { get; set; }

    [BsonElement("num_linea")]
    public int LineNum { get; set; }

    [BsonElement("codigo_producto")]
    public string ItemCode { get; set; } = string.Empty;

    [BsonElement("descripcion_item")]
    public string DescripcionItem { get; set; } = string.Empty;

    [BsonElement("cantidad")]
    public decimal Cantidad { get; set; }

    [BsonElement("precio_unitario")]
    public decimal PrecioUnitario { get; set; }

    [BsonElement("porcentaje_descuento")]
    public decimal PorcentajeDescuento { get; set; }

    [BsonElement("tipo_impuesto")]
    public string TaxCode { get; set; } = "IGV";

    [BsonElement("unidad_medida")]
    public string UnidadMedida { get; set; } = "NIU";

    [BsonElement("id_almacen")]
    public string IdAlmacen { get; set; } = "ALM01";

    [BsonElement("id_documento_base")]
    public int? BaseType { get; set; }

    [BsonElement("nro_base")]
    public int? BaseEntry { get; set; }

    [BsonElement("num_linea_base")]
    public int? BaseLine { get; set; }

    [BsonElement("monto_linea")]
    public decimal MontoLinea { get; set; }
}

[BsonIgnoreExtraElements]
public class LogSincronizacionSap {
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [BsonIgnoreIfDefault]
    [JsonIgnore]
    public string? MongoId { get; set; }

    [BsonElement("id_log")]
    public int IdLog { get; set; }

    [BsonElement("id_documento")]
    public int IdDocumento { get; set; }

    [BsonElement("tipo_documento")]
    public string TipoDocumento { get; set; } = string.Empty;

    [BsonElement("entidad_destino")]
    public string ObjetoSap { get; set; } = string.Empty;

    [BsonElement("tipo_operacion")]
    public string TipoOperacion { get; set; } = "REGISTRO";

    [BsonElement("fecha_ejecucion")]
    public DateTime FechaEjecucion { get; set; } = DateTime.UtcNow;

    [BsonElement("estado")]
    public string Estado { get; set; } = "SINCRONIZADO";

    [BsonElement("nro_transaccion_ext")]
    public int? DocEntrySap { get; set; }

    [BsonElement("codigo_error")]
    public int? ErrorCode { get; set; }

    [BsonElement("mensaje_respuesta")]
    public string ErrorMsg { get; set; } = string.Empty;

    [BsonElement("payload_json")]
    public string PayloadJson { get; set; } = string.Empty;
}
