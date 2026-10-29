using Microsoft.AspNetCore.Mvc;
using Erp.WebApi.Application.Services;
using Erp.WebApi.Domain.Interfaces;

namespace Erp.WebApi.Controllers;

[ApiController]
[Route("api/v1/integracion")]
public class IntegracionController : ControllerBase {
    private readonly ILogSincronizacionRepository _logRepository;
    private readonly ISalesOrderService _salesOrderService;

    public IntegracionController(
        ILogSincronizacionRepository logRepository,
        ISalesOrderService salesOrderService) {
        _logRepository = logRepository;
        _salesOrderService = salesOrderService;
    }

    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs() {
        var logs = await _logRepository.GetAllAsync();
        return Ok(logs);
    }

    [HttpPost("sincronizar-pendientes")]
    public async Task<IActionResult> SincronizarPendientes() {
        var procesados = await _salesOrderService.SincronizarPendientesConSapAsync();
        return Ok(new {
            message = procesados > 0
                ? $"Se procesaron y confirmaron exitosamente {procesados} documento(s) en el sistema."
                : "No existen documentos pendientes o con observación por confirmar.",
            procesados
        });
    }

    [HttpPost("reintentar/{idDocumento}")]
    public async Task<IActionResult> ReintentarDocumento(int idDocumento) {
        try {
            var log = await _salesOrderService.SincronizarDocumentoIndividualAsync(idDocumento);
            return Ok(new {
                message = $"Documento #{idDocumento} confirmado exitosamente (N° Operación: {log.DocEntrySap}).",
                log
            });
        } catch (Exception ex) {
            return BadRequest(new { message = ex.Message });
        }
    }
}
