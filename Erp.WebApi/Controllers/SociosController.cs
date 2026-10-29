using Microsoft.AspNetCore.Mvc;
using Erp.WebApi.Domain.Entities;
using Erp.WebApi.Domain.Interfaces;

namespace Erp.WebApi.Controllers;

[ApiController]
[Route("api/v1/socios")]
public class SociosController : ControllerBase {
    private readonly ISocioNegocioRepository _repo;

    private static readonly Dictionary<string, (string RazonSocial, string Direccion, string Distrito, string Provincia, string Departamento)> PadronSunatDemo = new() {
        ["20100070970"] = ("SUPERMERCADOS PERUANOS SOCIEDAD ANONIMA", "CAL. MORELLI NRO. 181 INT. P-2", "SAN BORJA", "LIMA", "LIMA"),
        ["20100047218"] = ("BANCO DE CREDITO DEL PERU", "CAL. CENTENARIO NRO. 156 URB. LAS LADERAS DE MELGAREJO", "LA MOLINA", "LIMA", "LIMA"),
        ["20427919111"] = ("CORPORACION ACEROS AREQUIPA S.A.", "AV. ANTONIO MIROQUESADA NRO. 425", "MAGDALENA DEL MAR", "LIMA", "LIMA"),
        ["20100128056"] = ("SAGA FALABELLA S A", "AV. PASEO DE LA REPUBLICA NRO. 3220", "SAN ISIDRO", "LIMA", "LIMA"),
        ["20556789023"] = ("COMERCIAL LOS ANDES S.A.C.", "AV. JAVIER PRADO ESTE 2450", "SAN BORJA", "LIMA", "LIMA"),
        ["20601234567"] = ("IMPORTACIONES TECNOLOGICAS DEL PERU S.A.C.", "AV. GARCILASO DE LA VEGA NRO. 1348", "CERCADO DE LIMA", "LIMA", "LIMA")
    };

    public SociosController(ISocioNegocioRepository repo) {
        _repo = repo;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? cardType) {
        var socios = await _repo.GetAllAsync(cardType);
        return Ok(socios);
    }

    [HttpGet("consultar-ruc/{ruc}")]
    public async Task<IActionResult> ConsultarRuc(string ruc) {
        if (string.IsNullOrWhiteSpace(ruc) || (ruc.Length != 11 && ruc.Length != 8)) {
            return BadRequest(new { message = "Ingrese un número de RUC (11 dígitos) o DNI (8 dígitos) válido." });
        }

        var socioLocal = await _repo.GetByRucAsync(ruc);
        if (socioLocal != null) {
            return Ok(new {
                ruc = socioLocal.LicTradNum,
                nombre_o_razonsocial = socioLocal.RazonSocial,
                estado_del_contribuyente = "ACTIVO",
                condicion_de_domicilio = "HABIDO",
                direccion = socioLocal.Direccion,
                distrito = "LIMA",
                provincia = "LIMA",
                departamento = "LIMA"
            });
        }

        if (PadronSunatDemo.TryGetValue(ruc, out var datos)) {
            return Ok(new {
                ruc,
                nombre_o_razonsocial = datos.RazonSocial,
                estado_del_contribuyente = "ACTIVO",
                condicion_de_domicilio = "HABIDO",
                direccion = datos.Direccion,
                distrito = datos.Distrito,
                provincia = datos.Provincia,
                departamento = datos.Departamento
            });
        }

        var sufijo = ruc.Substring(Math.Max(0, ruc.Length - 4));
        var esPersonaJuridica = ruc.StartsWith("20");
        var razonGenerada = esPersonaJuridica
            ? $"CORPORACION COMERCIAL E INDUSTRIAL {sufijo} S.A.C."
            : $"NEGOCIOS Y SERVICIOS GENERALES {sufijo} E.I.R.L.";

        return Ok(new {
            ruc,
            nombre_o_razonsocial = razonGenerada,
            estado_del_contribuyente = "ACTIVO",
            condicion_de_domicilio = "HABIDO",
            direccion = $"AV. EMPRESARIAL NRO. {sufijo} URB. INDUSTRIAL",
            distrito = "SAN ISIDRO",
            provincia = "LIMA",
            departamento = "LIMA"
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SocioNegocio socio) {
        if (string.IsNullOrWhiteSpace(socio.LicTradNum) || string.IsNullOrWhiteSpace(socio.RazonSocial)) {
            return BadRequest(new { message = "El RUC/DNI y la Razón Social son obligatorios." });
        }

        if (string.IsNullOrWhiteSpace(socio.CardCodeSap)) {
            socio.CardCodeSap = (socio.CardType == "S" ? "P" : "C") + socio.LicTradNum;
        }
        if (string.IsNullOrWhiteSpace(socio.Estado)) {
            socio.Estado = "ACTIVO";
        }
        if (string.IsNullOrWhiteSpace(socio.EstadoSync)) {
            socio.EstadoSync = "SINCRONIZADO";
        }

        await _repo.AddAsync(socio);
        return Ok(new { message = "Socio creado exitosamente", idSocio = socio.IdSocio, cardCode = socio.CardCodeSap, socio });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] SocioNegocio socio) {
        var existente = await _repo.GetByIdAsync(id);
        if (existente == null) {
            return NotFound(new { message = "Socio de negocio no encontrado." });
        }

        existente.RazonSocial = socio.RazonSocial;
        existente.LicTradNum = socio.LicTradNum;
        existente.CardType = socio.CardType;
        existente.CardCodeSap = string.IsNullOrWhiteSpace(socio.CardCodeSap)
            ? (socio.CardType == "S" ? "P" : "C") + socio.LicTradNum
            : socio.CardCodeSap;
        existente.Direccion = socio.Direccion;
        existente.Telefono = socio.Telefono;
        existente.Correo = socio.Correo;
        existente.CondicionPago = socio.CondicionPago;
        existente.Estado = socio.Estado;
        existente.EstadoSync = "SINCRONIZADO";

        await _repo.UpdateAsync(existente);
        return Ok(existente);
    }
}
