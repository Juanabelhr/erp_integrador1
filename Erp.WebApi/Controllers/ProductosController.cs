using Microsoft.AspNetCore.Mvc;
using Erp.WebApi.Domain.Entities;
using Erp.WebApi.Domain.Interfaces;

namespace Erp.WebApi.Controllers;

[ApiController]
[Route("api/v1/productos")]
public class ProductosController : ControllerBase {
    private readonly IProductoRepository _repo;

    public ProductosController(IProductoRepository repo) {
        _repo = repo;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() {
        var productos = await _repo.GetAllAsync();
        return Ok(productos);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Producto producto) {
        if (string.IsNullOrWhiteSpace(producto.ItemCode)) {
            return BadRequest(new { message = "El código del artículo (ItemCode) es obligatorio." });
        }
        var existente = await _repo.GetByItemCodeAsync(producto.ItemCode);
        if (existente != null) {
            return BadRequest(new { message = $"Ya existe un artículo con el código {producto.ItemCode}." });
        }
        if (producto.PrecioCompra <= 0 && producto.PrecioReferencial > 0) {
            producto.PrecioCompra = Math.Round(producto.PrecioReferencial * 0.75m, 2);
        }
        if (string.IsNullOrWhiteSpace(producto.Estado)) {
            producto.Estado = "ACTIVO";
        }
        await _repo.AddAsync(producto);
        return Ok(new { message = "Producto registrado exitosamente en el catálogo", itemCode = producto.ItemCode, producto });
    }

    [HttpPut("{itemCode}")]
    public async Task<IActionResult> Update(string itemCode, [FromBody] Producto producto) {
        var existente = await _repo.GetByItemCodeAsync(itemCode);
        if (existente == null) {
            return NotFound(new { message = "Producto no encontrado." });
        }
        existente.ItemName = producto.ItemName;
        existente.Categoria = string.IsNullOrWhiteSpace(producto.Categoria) ? existente.Categoria : producto.Categoria;
        existente.UnidadMedida = string.IsNullOrWhiteSpace(producto.UnidadMedida) ? existente.UnidadMedida : producto.UnidadMedida;
        existente.PrecioCompra = producto.PrecioCompra;
        existente.PrecioReferencial = producto.PrecioReferencial;
        existente.StockActual = producto.StockActual;
        existente.StockMinimo = producto.StockMinimo;
        existente.Estado = string.IsNullOrWhiteSpace(producto.Estado) ? existente.Estado : producto.Estado;

        await _repo.UpdateAsync(existente);
        return Ok(existente);
    }
}
