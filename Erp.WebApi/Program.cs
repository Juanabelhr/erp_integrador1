using Erp.WebApi.Application.Services;
using Erp.WebApi.Domain.Interfaces;
using Erp.WebApi.Infrastructure.Mocks;
using Erp.WebApi.Infrastructure.Mongo;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Conexión Real a MongoDB (localhost:27017 -> ERP_Comercial_DB)
builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddSingleton<IUnitOfWork, MockUnitOfWork>();
builder.Services.AddSingleton<IUsuarioRepository, MongoUsuarioRepository>();
builder.Services.AddSingleton<ISocioNegocioRepository, MongoSocioNegocioRepository>();
builder.Services.AddSingleton<IDocumentoRepository, MongoDocumentoRepository>();
builder.Services.AddSingleton<IProductoRepository, MongoProductoRepository>();
builder.Services.AddSingleton<ILogSincronizacionRepository, MongoLogSincronizacionRepository>();
builder.Services.AddSingleton<ISAPSyncStrategy, SapDiApiSyncStrategy>();

// Servicios de aplicación
builder.Services.AddScoped<ISalesOrderService, SalesOrderService>();

var app = builder.Build();

// Inicializar conexión y verificar las 7 colecciones en MongoDB al arrancar
app.Services.GetRequiredService<MongoDbContext>();

// Habilitar Swagger siempre (útil para pruebas en Dokploy y desarrollo)
app.UseSwagger();
app.UseSwaggerUI();

// Configuración CORS para integración con SPA Web
app.UseCors(x => x.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

app.UseAuthorization();
app.MapGet("/", () => Results.Redirect("/swagger"));
app.MapControllers();

app.Run();
