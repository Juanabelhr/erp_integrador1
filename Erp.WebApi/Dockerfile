# Imagen de compilación de .NET 8 SDK
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["Erp.WebApi.csproj", "./"]
RUN dotnet restore "./Erp.WebApi.csproj"

COPY . .
RUN dotnet publish "./Erp.WebApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Imagen de producción ligera ASP.NET 8 Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080
ENTRYPOINT ["dotnet", "Erp.WebApi.dll"]
