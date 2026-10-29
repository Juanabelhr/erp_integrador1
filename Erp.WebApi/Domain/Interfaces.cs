using Erp.WebApi.Domain.Entities;

namespace Erp.WebApi.Domain.Interfaces;

public interface IUnitOfWork {
    Task BeginTransactionAsync();
    Task CommitAsync();
    Task RollbackAsync();
    Task<int> SaveChangesAsync();
}

public interface IDocumentoRepository {
    Task AddAsync(DocumentoComercial documento);
    Task UpdateAsync(DocumentoComercial documento);
    Task<DocumentoComercial?> GetByIdAsync(int id);
    Task<IEnumerable<DocumentoComercial>> GetAllAsync(string? tipoDocumento = null);
    Task<IEnumerable<DocumentoComercial>> GetPendientesSincronizacionAsync();
}

public interface ISocioNegocioRepository {
    Task<SocioNegocio?> GetByIdAsync(int id);
    Task<SocioNegocio?> GetByRucAsync(string licTradNum);
    Task<IEnumerable<SocioNegocio>> GetAllAsync(string? cardType = null);
    Task AddAsync(SocioNegocio socio);
    Task UpdateAsync(SocioNegocio socio);
}

public interface IProductoRepository {
    Task<Producto?> GetByItemCodeAsync(string itemCode);
    Task<IEnumerable<Producto>> GetAllAsync();
    Task AddAsync(Producto producto);
    Task UpdateAsync(Producto producto);
}

public interface IUsuarioRepository {
    Task<Usuario?> GetByEmailAsync(string email);
    Task<Usuario?> GetByIdAsync(int id);
    Task<IEnumerable<Usuario>> GetAllAsync();
    Task AddAsync(Usuario usuario);
    Task UpdateAsync(Usuario usuario);
    Task<IEnumerable<Rol>> GetRolesAsync();
}

public interface ILogSincronizacionRepository {
    Task AddAsync(LogSincronizacionSap log);
    Task UpdateAsync(LogSincronizacionSap log);
    Task<LogSincronizacionSap?> GetByDocumentoIdAsync(int idDocumento);
    Task<IEnumerable<LogSincronizacionSap>> GetAllAsync();
}

public interface ISAPSyncStrategy {
    Task<LogSincronizacionSap> SincronizarDocumentoAsync(DocumentoComercial doc);
}
