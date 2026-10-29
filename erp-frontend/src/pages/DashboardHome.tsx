import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  TrendingUp, ShoppingBag, Package, Users, FileText
} from 'lucide-react';

export default function DashboardHome() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const cargarDashboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/pedidos/dashboard');
      setMetrics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  if (loading && !metrics) {
    return <div className="p-8 text-center text-gray-500">Cargando métricas del sistema ERP...</div>;
  }

  const totalVentas = metrics?.totalVentas ?? 0;
  const totalCompras = metrics?.totalCompras ?? 0;
  const stockTotal = metrics?.stockTotalUnidades ?? 0;
  const bajoStock = metrics?.productosBajoStock ?? 0;
  const clientesActivos = metrics?.clientesActivos ?? 0;
  const proveedoresActivos = metrics?.proveedoresActivos ?? 0;
  const ultimasOperaciones = metrics?.ultimasOperaciones ?? [];

  return (
    <div className="space-y-6">
      {/* Encabezado Ejecutivo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel de Control General</h1>
          <p className="text-gray-500 text-sm mt-1">
            Resumen operativo en tiempo real de ventas, compras, inventario y flujo de comprobantes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/compras/nueva"
            className="bg-erpBlue hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition shadow-sm"
          >
            + Nueva Compra
          </Link>
          <Link
            to="/pedidos/nuevo"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition shadow-sm"
          >
            + Nueva Venta
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-500">Total Ventas</span>
            <div className="p-2.5 bg-blue-50 text-erpBlue rounded-lg">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-800">
            S/ {Number(totalVentas).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-green-600 font-semibold flex items-center gap-1">
            <span>↑ +12.4% vs. mes anterior</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-500">Total Compras</span>
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-lg">
              <ShoppingBag size={22} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-800">
            S/ {Number(totalCompras).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-purple-600 font-semibold flex items-center gap-1">
            <span>Órdenes de abastecimiento activas</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-500">Stock en Almacén</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <Package size={22} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-800">
            {stockTotal} <span className="text-sm font-normal text-gray-500">unidades</span>
          </div>
          <div className="mt-2 text-xs font-semibold flex items-center gap-1">
            {bajoStock > 0 ? (
              <span className="text-amber-600">⚠ {bajoStock} producto(s) en stock mínimo</span>
            ) : (
              <span className="text-green-600">✓ Niveles óptimos de inventario</span>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-500">Socios Activos</span>
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
              <Users size={22} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-gray-800">
            {clientesActivos + proveedoresActivos}
          </div>
          <div className="mt-2 text-xs text-gray-600 font-medium">
            {clientesActivos} Clientes · {proveedoresActivos} Proveedores
          </div>
        </div>
      </div>

      {/* Tabla de Últimas Operaciones Comerciales */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Últimas Operaciones Comerciales</h3>
            <p className="text-xs text-gray-500">Transacciones recientes de ventas y compras registradas en el ERP</p>
          </div>
          <Link to="/reportes" className="text-xs font-bold text-erpBlue hover:underline flex items-center gap-1">
            <FileText size={14} /> Descargar Reportes
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase border-b">
                <th className="p-3">N° Comprobante</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Cliente / Proveedor</th>
                <th className="p-3">Fecha</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ultimasOperaciones.map((op: any) => (
                <tr key={op.idDocumento} className="border-b hover:bg-gray-50 text-sm">
                  <td className="p-3 font-mono font-semibold text-gray-800">
                    {op.serieCorrelativo || `#${op.idDocumento}`}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      op.tipoDocumento.includes('COMPRA') || op.tipoDocumento.includes('ENTRADA') || op.tipoDocumento.includes('PROVEEDOR')
                        ? 'bg-purple-100 text-purple-800'
                        : op.tipoDocumento === 'COTIZACION'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {op.tipoDocumento}
                    </span>
                  </td>
                  <td className="p-3 text-gray-700 truncate max-w-[260px]" title={op.razonSocialSocio}>
                    {op.razonSocialSocio || `Socio #${op.idSocio}`}
                  </td>
                  <td className="p-3 text-gray-500 text-xs">
                    {op.fechaEmision?.slice(0, 10)}
                  </td>
                  <td className="p-3 text-right font-semibold text-gray-800">
                    {op.moneda === 'USD' ? '$ ' : 'S/ '}
                    {Number(op.montoTotal).toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      Registrado
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
