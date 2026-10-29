using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Erp.WebApi.Application.Dtos;
using Erp.WebApi.Domain.Entities;
using Erp.WebApi.Domain.Interfaces;
using Erp.WebApi.Infrastructure.Mocks;

namespace Erp.WebApi.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase {
    private readonly IUsuarioRepository _usuarioRepository;

    public AuthController(IUsuarioRepository usuarioRepository) {
        _usuarioRepository = usuarioRepository;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto) {
        var usuario = await _usuarioRepository.GetByEmailAsync(dto.Email);
        
        if (usuario == null || !SecurityHelper.VerifyPassword(dto.Password, usuario.PasswordHash)) {
            return Unauthorized(new { message = "Credenciales incorrectas. Verifique su correo y contraseña." });
        }

        if (usuario.Estado != "ACTIVO") {
            return Unauthorized(new { message = "La cuenta de usuario se encuentra bloqueada o inactiva." });
        }

        usuario.UltimoAcceso = DateTime.UtcNow;
        await _usuarioRepository.UpdateAsync(usuario);

        var payloadObj = new {
            sub = usuario.IdUsuario,
            email = usuario.Email,
            role = usuario.NombreRol,
            iat = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            exp = DateTimeOffset.UtcNow.AddHours(8).ToUnixTimeSeconds()
        };
        var payloadBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(payloadObj)));
        var jwtToken = $"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.{payloadBase64}.erp_sap_b1_sig_2026";
        
        return Ok(new {
            token = jwtToken,
            idUsuario = usuario.IdUsuario,
            usuario = usuario.Email,
            nombreCompleto = $"{usuario.Nombres} {usuario.Apellidos}".Trim(),
            idRol = usuario.IdRol,
            rol = usuario.NombreRol
        });
    }

    [HttpGet("usuarios")]
    public async Task<IActionResult> GetUsuarios() {
        var usuarios = await _usuarioRepository.GetAllAsync();
        return Ok(usuarios);
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles() {
        var roles = await _usuarioRepository.GetRolesAsync();
        return Ok(roles);
    }

    [HttpPost("usuarios")]
    public async Task<IActionResult> CrearUsuario([FromBody] CrearUsuarioDto dto) {
        var existente = await _usuarioRepository.GetByEmailAsync(dto.Email);
        if (existente != null) {
            return BadRequest(new { message = "Ya existe un usuario registrado con ese correo electrónico." });
        }

        var nuevo = new Usuario {
            CodigoEmpleado = string.IsNullOrWhiteSpace(dto.CodigoEmpleado) ? $"EMP-00{Random.Shared.Next(10, 99)}" : dto.CodigoEmpleado,
            Nombres = dto.Nombres,
            Apellidos = dto.Apellidos,
            Email = dto.Email,
            PasswordHash = SecurityHelper.HashPassword(string.IsNullOrWhiteSpace(dto.Password) ? "123456" : dto.Password),
            IdRol = dto.IdRol,
            Estado = string.IsNullOrWhiteSpace(dto.Estado) ? "ACTIVO" : dto.Estado,
            FechaCreacion = DateTime.UtcNow
        };

        await _usuarioRepository.AddAsync(nuevo);
        return Ok(nuevo);
    }

    [HttpPut("usuarios/{id}/estado")]
    public async Task<IActionResult> CambiarEstado(int id) {
        var u = await _usuarioRepository.GetByIdAsync(id);
        if (u == null) return NotFound(new { message = "Usuario no encontrado." });
        u.Estado = u.Estado == "ACTIVO" ? "INACTIVO" : "ACTIVO";
        await _usuarioRepository.UpdateAsync(u);
        return Ok(u);
    }
}
