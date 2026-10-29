using Microsoft.AspNetCore.Mvc;
using Erp.WebApi.Application.Dtos;
using Erp.WebApi.Application.Services;
using Erp.WebApi.Domain.Interfaces;

namespace Erp.WebApi.Controllers;

[ApiController]
[Route("api/v1/pedidos")]
public class PedidosController : ControllerBase {
    private readonly ISalesOrderService _salesOrderService;
    private readonly IDocumentoRepository _documentoRepository;
    private readonly IProductoRepository _productoRepository;
    private readonly ISocioNegocioRepository _socioRepository;

    public PedidosController(
        ISalesOrderService salesOrderService,
        IDocumentoRepository documentoRepository,
        IProductoRepository productoRepository,
        ISocioNegocioRepository socioRepository) {
        _salesOrderService = salesOrderService;
        _documentoRepository = documentoRepository;
        _productoRepository = productoRepository;
        _socioRepository = socioRepository;
    }

    [HttpPost]
    public async Task<IActionResult> CrearPedido([FromBody] CrearPedidoDto dto) {
        try {
            var doc = await _salesOrderService.CrearDocumentoComercialAsync(dto);
            return Ok(new {
                message = "Documento comercial registrado exitosamente en el sistema",
                idDocumento = doc.IdDocumento,
                serieCorrelativo = doc.SerieCorrelativo,
                documento = doc
            });
        } catch (Exception ex) {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetPedidos([FromQuery] string? tipo) {
        var pedidos = await _documentoRepository.GetAllAsync(tipo);
        return Ok(pedidos);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardMetrics() {
        var docs = (await _documentoRepository.GetAllAsync()).ToList();
        var prods = (await _productoRepository.GetAllAsync()).ToList();
        var socios = (await _socioRepository.GetAllAsync()).ToList();

        var totalVentas = docs.Where(d => d.TipoDocumento is "COTIZACION" or "PEDIDO" or "GUIA_REMISION" or "FACTURA").Sum(d => d.MontoTotal);
        var totalCompras = docs.Where(d => d.TipoDocumento is "ORDEN_COMPRA" or "ENTRADA_MERCADERIA" or "FACTURA_PROVEEDOR").Sum(d => d.MontoTotal);
        var stockTotal = prods.Sum(p => p.StockActual);
        var bajoStock = prods.Count(p => p.StockActual <= p.StockMinimo);
        var clientesActivos = socios.Count(s => s.CardType == "C" && s.Estado == "ACTIVO");
        var proveedoresActivos = socios.Count(s => s.CardType == "S" && s.Estado == "ACTIVO");

        return Ok(new {
            totalVentas,
            totalCompras,
            stockTotalUnidades = stockTotal,
            productosBajoStock = bajoStock,
            clientesActivos,
            proveedoresActivos,
            documentosSincronizados = docs.Count(d => d.EstadoProceso == "SINCRONIZADO"),
            documentosPendientes = docs.Count(d => d.EstadoProceso == "PENDIENTE_SINCRONIZACION"),
            documentosConError = docs.Count(d => d.EstadoProceso == "ERROR_SINCRONIZACION"),
            ultimasOperaciones = docs.OrderByDescending(d => d.FechaEmision).Take(8)
        });
    }
}
