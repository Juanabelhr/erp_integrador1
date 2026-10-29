using System.Text.Json;
using Erp.WebApi.Domain.Entities;
using Erp.WebApi.Domain.Interfaces;
using Erp.WebApi.Application.Dtos;

namespace Erp.WebApi.Application.Services;

public interface ISalesOrderService {
    Task<DocumentoComercial> CrearDocumentoComercialAsync(CrearPedidoDto dto);
    Task<int> SincronizarPendientesConSapAsync();
    Task<LogSincronizacionSap> SincronizarDocumentoIndividualAsync(int idDocumento);
}

public class SapDiApiSyncStrategy : ISAPSyncStrategy {
    private static int _nextDocEntrySap = 15425;
    private static int _nextDocNumSap = 8001250;

    public static string ObtenerObjetoSap(string tipoDoc) => tipoDoc switch {
        "COTIZACION" => "Ventas - Cotizaciones",
        "PEDIDO" => "Ventas - Pedidos",
        "GUIA_REMISION" => "Almacén - Guías de Remisión",
        "FACTURA" => "Facturación - Facturas de Venta",
        "ORDEN_COMPRA" => "Compras - Órdenes de Compra",
        "ENTRADA_MERCADERIA" => "Almacén - Recepción de Mercadería",
        "FACTURA_PROVEEDOR" => "Compras - Facturas de Proveedor",
        _ => "Ventas - Operaciones"
    };

    public static int ObtenerObjTypeNumerico(string tipoDoc) => tipoDoc switch {
        "COTIZACION" => 23,
        "PEDIDO" => 17,
        "GUIA_REMISION" => 15,
        "FACTURA" => 13,
        "ORDEN_COMPRA" => 22,
        "ENTRADA_MERCADERIA" => 20,
        "FACTURA_PROVEEDOR" => 18,
        _ => 17
    };

    public Task<LogSincronizacionSap> SincronizarDocumentoAsync(DocumentoComercial doc) {
        var objetoSap = ObtenerObjetoSap(doc.TipoDocumento);

        int docEntry = _nextDocEntrySap++;
        int docNum = _nextDocNumSap++;

        doc.DocEntrySap = docEntry;
        doc.DocNumSap = docNum;
        doc.EstadoProceso = "SINCRONIZADO";

        var payload = new {
            CardCode = doc.CardCodeSocio,
            CardName = doc.RazonSocialSocio,
            DocDate = doc.FechaEmision.ToString("yyyy-MM-dd"),
            DocDueDate = doc.FechaVencimiento.ToString("yyyy-MM-dd"),
            TaxDate = doc.FechaDocumento.ToString("yyyy-MM-dd"),
            DocCurrency = doc.Moneda,
            DocRate = doc.TipoCambio,
            PaymentGroupCode = doc.CondicionPago,
            SalesPersonCode = doc.SlpCode,
            NumAtCard = doc.NumAtCard,
            Address2 = doc.DireccionEntrega,
            U_BPP_MDTD = doc.TipoDocumento == "FACTURA" ? "01" : doc.TipoDocumento == "GUIA_REMISION" ? "09" : "00",
            Comments = doc.Observaciones,
            DocumentLines = doc.Detalles.Select(d => new {
                d.LineNum,
                d.ItemCode,
                ItemDescription = d.DescripcionItem,
                Quantity = d.Cantidad,
                UnitPrice = d.PrecioUnitario,
                DiscountPercent = d.PorcentajeDescuento,
                TaxCode = d.TaxCode,
                UoMCode = d.UnidadMedida,
                WarehouseCode = d.IdAlmacen,
                BaseType = d.BaseType ?? -1,
                BaseEntry = d.BaseEntry,
                BaseLine = d.BaseLine
            })
        };

        var log = new LogSincronizacionSap {
            IdDocumento = doc.IdDocumento,
            TipoDocumento = doc.TipoDocumento,
            ObjetoSap = objetoSap,
            TipoOperacion = "CONFIRMACION",
            FechaEjecucion = DateTime.UtcNow,
            Estado = "SINCRONIZADO",
            DocEntrySap = docEntry,
            ErrorCode = 0,
            ErrorMsg = $"Transacción procesada y confirmada exitosamente ({objetoSap}). N° Operación: {docEntry}",
            PayloadJson = JsonSerializer.Serialize(payload)
        };

        return Task.FromResult(log);
    }
}

public class SalesOrderService : ISalesOrderService {
    private readonly IDocumentoRepository _documentoRepository;
    private readonly ISocioNegocioRepository _socioNegocioRepository;
    private readonly IProductoRepository _productoRepository;
    private readonly ILogSincronizacionRepository _logRepository;
    private readonly ISAPSyncStrategy _sapSyncStrategy;
    private readonly IUnitOfWork _unitOfWork;

    public SalesOrderService(
        IDocumentoRepository documentoRepository,
        ISocioNegocioRepository socioNegocioRepository,
        IProductoRepository productoRepository,
        ILogSincronizacionRepository logRepository,
        ISAPSyncStrategy sapSyncStrategy,
        IUnitOfWork unitOfWork) {
        _documentoRepository = documentoRepository;
        _socioNegocioRepository = socioNegocioRepository;
        _productoRepository = productoRepository;
        _logRepository = logRepository;
        _sapSyncStrategy = sapSyncStrategy;
        _unitOfWork = unitOfWork;
    }

    public async Task<DocumentoComercial> CrearDocumentoComercialAsync(CrearPedidoDto dto) {
        await _unitOfWork.BeginTransactionAsync();

        try {
            var socio = await _socioNegocioRepository.GetByIdAsync(dto.IdSocio);
            if (socio == null || socio.Estado != "ACTIVO")
                throw new Exception("Cliente o proveedor inválido o inactivo en el directorio.");

            if (dto.Detalles == null || dto.Detalles.Count == 0 || dto.Detalles.All(d => string.IsNullOrWhiteSpace(d.ItemCode)))
                throw new Exception("Debe incluir al menos una línea de producto válida en el documento.");

            var tipoDoc = string.IsNullOrWhiteSpace(dto.TipoDocumento) ? "COTIZACION" : dto.TipoDocumento.ToUpperInvariant();

            DocumentoComercial? docBase = null;
            int? baseObjType = null;
            int? baseEntrySap = null;

            if (dto.BaseDocId.HasValue && dto.BaseDocId.Value > 0) {
                docBase = await _documentoRepository.GetByIdAsync(dto.BaseDocId.Value);
                if (docBase != null) {
                    baseObjType = SapDiApiSyncStrategy.ObtenerObjTypeNumerico(docBase.TipoDocumento);
                    baseEntrySap = docBase.DocEntrySap ?? docBase.IdDocumento;
                }
            }

            // Validar stock para PEDIDO, GUIA_REMISION y FACTURA
            if (tipoDoc is "PEDIDO" or "GUIA_REMISION" or "FACTURA") {
                foreach (var item in dto.Detalles) {
                    if (item.Cantidad <= 0)
                        throw new Exception($"La cantidad para el artículo {item.ItemCode} debe ser mayor a cero.");

                    var prod = await _productoRepository.GetByItemCodeAsync(item.ItemCode);
                    if (prod == null)
                        throw new Exception($"El producto {item.ItemCode} no existe en el catálogo.");

                    // Si es Factura pero ya vino de Guía de Remisión, el stock ya se descontó en la Guía
                    bool yaDescontoEnGuia = tipoDoc == "FACTURA" && docBase?.TipoDocumento == "GUIA_REMISION";
                    if (!yaDescontoEnGuia && prod.StockActual < item.Cantidad)
                        throw new Exception($"Stock insuficiente para '{prod.ItemName}' ({prod.ItemCode}). Disponible: {prod.StockActual}, Solicitado: {item.Cantidad}.");
                }
            }

            var pedido = new DocumentoComercial {
                TipoDocumento = tipoDoc,
                IdSocio = dto.IdSocio,
                RazonSocialSocio = socio.RazonSocial,
                CardCodeSocio = socio.CardCodeSap,
                IdUsuarioCreador = dto.IdUsuarioCreador <= 0 ? 1 : dto.IdUsuarioCreador,
                FechaEmision = dto.FechaEmision == default ? DateTime.UtcNow : dto.FechaEmision,
                FechaVencimiento = dto.FechaVencimiento == default ? DateTime.UtcNow.AddDays(30) : dto.FechaVencimiento,
                FechaDocumento = dto.FechaDocumento == default ? DateTime.UtcNow : dto.FechaDocumento,
                Moneda = string.IsNullOrWhiteSpace(dto.Moneda) ? "PEN" : dto.Moneda,
                TipoCambio = dto.TipoCambio <= 0 ? 3.75m : dto.TipoCambio,
                CondicionPago = string.IsNullOrWhiteSpace(dto.CondicionPago) ? socio.CondicionPago : dto.CondicionPago,
                SlpCode = dto.SlpCode <= 0 ? 1 : dto.SlpCode,
                NumAtCard = dto.NumAtCard ?? string.Empty,
                DireccionEntrega = string.IsNullOrWhiteSpace(dto.DireccionEntrega) ? socio.Direccion : dto.DireccionEntrega,
                Transportista = dto.Transportista ?? string.Empty,
                BaseDocId = docBase?.IdDocumento,
                BaseType = baseObjType,
                BaseSerieCorrelativo = docBase?.SerieCorrelativo,
                EstadoProceso = "PENDIENTE_SINCRONIZACION",
                EstadoFlujo = "ABIERTO",
                Observaciones = dto.Observaciones,
                Subtotal = 0,
                ImpuestoIgv = 0,
                MontoTotal = 0
            };

            int lineNum = 0;
            decimal igvAcumulado = 0;

            foreach (var item in dto.Detalles) {
                var prod = await _productoRepository.GetByItemCodeAsync(item.ItemCode);
                decimal montoLineaSinIgv = Math.Round((item.Cantidad * item.PrecioUnitario) * (1 - (item.PorcentajeDescuento / 100m)), 2);
                string taxCode = string.IsNullOrWhiteSpace(item.TaxCode) ? "IGV" : item.TaxCode.ToUpperInvariant();
                decimal igvLinea = taxCode == "IGV" ? Math.Round(montoLineaSinIgv * 0.18m, 2) : 0m;

                pedido.Detalles.Add(new DetalleDocumento {
                    LineNum = ++lineNum,
                    ItemCode = item.ItemCode,
                    DescripcionItem = !string.IsNullOrWhiteSpace(item.DescripcionItem) ? item.DescripcionItem : (prod?.ItemName ?? item.ItemCode),
                    Cantidad = item.Cantidad,
                    PrecioUnitario = item.PrecioUnitario,
                    PorcentajeDescuento = item.PorcentajeDescuento,
                    TaxCode = taxCode,
                    UnidadMedida = !string.IsNullOrWhiteSpace(item.UnidadMedida) ? item.UnidadMedida : (prod?.UnidadMedida ?? "NIU"),
                    IdAlmacen = string.IsNullOrWhiteSpace(item.IdAlmacen) ? "ALM01" : item.IdAlmacen,
                    BaseType = baseObjType,
                    BaseEntry = baseEntrySap,
                    BaseLine = lineNum - 1,
                    MontoLinea = montoLineaSinIgv
                });
                pedido.Subtotal += montoLineaSinIgv;
                igvAcumulado += igvLinea;

                // Movimiento de stock físico (SAP B1: ODLN Entrega descuenta stock; Factura directa sin Guía también descuenta; OPDN Entrada o OPOR incrementa)
                if (prod != null) {
                    if (tipoDoc == "GUIA_REMISION" || (tipoDoc == "FACTURA" && docBase?.TipoDocumento != "GUIA_REMISION")) {
                        prod.StockActual -= item.Cantidad;
                        await _productoRepository.UpdateAsync(prod);
                    } else if (tipoDoc == "ENTRADA_MERCADERIA" || (tipoDoc == "ORDEN_COMPRA" && docBase == null)) {
                        // En compras incrementamos al registrar la Orden/Entrada (evitando duplicar si pasa de OC a Entrada)
                        if (tipoDoc == "ORDEN_COMPRA" || (tipoDoc == "ENTRADA_MERCADERIA" && docBase?.TipoDocumento != "ORDEN_COMPRA")) {
                            prod.StockActual += item.Cantidad;
                            await _productoRepository.UpdateAsync(prod);
                        }
                    }
                }
            }

            pedido.ImpuestoIgv = igvAcumulado;
            pedido.MontoTotal = Math.Round(pedido.Subtotal + pedido.ImpuestoIgv, 2);

            if (docBase != null) {
                docBase.EstadoFlujo = "CERRADO";
                await _documentoRepository.UpdateAsync(docBase);
            }

            await _documentoRepository.AddAsync(pedido);

            var objetoSap = SapDiApiSyncStrategy.ObtenerObjetoSap(tipoDoc);

            var payload = new {
                CardCode = pedido.CardCodeSocio,
                DocDate = pedido.FechaEmision.ToString("yyyy-MM-dd"),
                DocDueDate = pedido.FechaVencimiento.ToString("yyyy-MM-dd"),
                TaxDate = pedido.FechaDocumento.ToString("yyyy-MM-dd"),
                DocCur = pedido.Moneda,
                DocRate = pedido.TipoCambio,
                GroupNum = pedido.CondicionPago,
                SlpCode = pedido.SlpCode,
                NumAtCard = pedido.NumAtCard,
                Address2 = pedido.DireccionEntrega,
                BaseRef = pedido.BaseSerieCorrelativo,
                DocumentLines = pedido.Detalles.Select(d => new {
                    d.ItemCode,
                    Quantity = d.Cantidad,
                    UnitPrice = d.PrecioUnitario,
                    DiscountPercent = d.PorcentajeDescuento,
                    d.TaxCode,
                    UoMCode = d.UnidadMedida,
                    WarehouseCode = d.IdAlmacen,
                    d.BaseType,
                    d.BaseEntry,
                    d.BaseLine
                })
            };

            await _logRepository.AddAsync(new LogSincronizacionSap {
                IdDocumento = pedido.IdDocumento,
                TipoDocumento = pedido.TipoDocumento,
                ObjetoSap = objetoSap,
                TipoOperacion = "QUEUE",
                FechaEjecucion = DateTime.UtcNow,
                Estado = "PENDIENTE_SINCRONIZACION",
                DocEntrySap = null,
                ErrorCode = null,
                ErrorMsg = pedido.BaseSerieCorrelativo != null
                    ? $"Documento generado a partir de {pedido.BaseSerieCorrelativo} y registrado en auditoría."
                    : "Documento comercial validado y registrado en el historial de operaciones.",
                PayloadJson = JsonSerializer.Serialize(payload)
            });

            await _unitOfWork.SaveChangesAsync();
            await _unitOfWork.CommitAsync();

            return pedido;
        } catch {
            await _unitOfWork.RollbackAsync();
            throw;
        }
    }

    public async Task<int> SincronizarPendientesConSapAsync() {
        var pendientes = (await _documentoRepository.GetPendientesSincronizacionAsync()).ToList();
        int count = 0;
        foreach (var doc in pendientes) {
            await SincronizarDocumentoIndividualAsync(doc.IdDocumento);
            count++;
        }
        return count;
    }

    public async Task<LogSincronizacionSap> SincronizarDocumentoIndividualAsync(int idDocumento) {
        var doc = await _documentoRepository.GetByIdAsync(idDocumento);
        if (doc == null)
            throw new Exception($"No se encontró el documento local #{idDocumento}.");

        var nuevoLog = await _sapSyncStrategy.SincronizarDocumentoAsync(doc);
        await _documentoRepository.UpdateAsync(doc);

        var logExistente = await _logRepository.GetByDocumentoIdAsync(idDocumento);
        if (logExistente != null) {
            logExistente.Estado = nuevoLog.Estado;
            logExistente.DocEntrySap = nuevoLog.DocEntrySap;
            logExistente.ErrorCode = nuevoLog.ErrorCode;
            logExistente.ErrorMsg = nuevoLog.ErrorMsg;
            logExistente.FechaEjecucion = nuevoLog.FechaEjecucion;
            logExistente.TipoOperacion = nuevoLog.TipoOperacion;
            logExistente.PayloadJson = nuevoLog.PayloadJson;
            await _logRepository.UpdateAsync(logExistente);
            return logExistente;
        } else {
            await _logRepository.AddAsync(nuevoLog);
            return nuevoLog;
        }
    }
}
