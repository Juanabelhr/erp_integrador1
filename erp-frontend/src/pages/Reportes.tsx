import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, FileSpreadsheet, TrendingUp, ShoppingCart, Package, Users } from 'lucide-react';

export default function Reportes() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [socios, setSocios] = useState<any[]>([]);

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        const [resD, resP, resS] = await Promise.all([
          axios.get('/api/v1/pedidos'),
          axios.get('/api/v1/productos'),
          axios.get('/api/v1/socios')
        ]);
        setPedidos(resD.data);
        setProductos(resP.data);
        setSocios(resS.data);
      } catch (e) {
        console.error(e);
      }
    };
    cargarTodo();
  }, []);

  const exportarCsv = (nombreArchivo: string, cabeceras: string[], filas: any[][]) => {
    const bom = '\uFEFF';
    const contenido = [
      cabeceras.join(';'),
      ...filas.map(f => f.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n');

    const blob = new Blob([bom + contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const descargarVentas = () => {
    const ventas = pedidos.filter(d => !d.tipoDocumento.includes('COMPRA') && !d.tipoDocumento.includes('ENTRADA') && !d.tipoDocumento.includes('PROVEEDOR'));
    exportarCsv(
      'Reporte_Ventas_ERP',
      ['ID Documento', 'Comprobante', 'Tipo', 'Código Cliente', 'Cliente', 'Fecha Emisión', 'Moneda', 'Subtotal', 'IGV (18%)', 'Total', 'Estado', 'N° Operación'],
      ventas.map(v => [
        v.idDocumento, v.serieCorrelativo, v.tipoDocumento, v.cardCodeSocio,
        v.razonSocialSocio, v.fechaEmision?.slice(0, 10), v.moneda,
        v.subtotal, v.impuestoIgv, v.montoTotal, v.estadoProceso === 'SINCRONIZADO' ? 'COMPLETADO' : v.estadoProceso, v.docEntrySap || '-'
      ])
    );
  };

  const descargarCompras = () => {
    const compras = pedidos.filter(d => d.tipoDocumento.includes('COMPRA') || d.tipoDocumento.includes('ENTRADA') || d.tipoDocumento.includes('PROVEEDOR'));
    exportarCsv(
      'Reporte_Compras_ERP',
      ['ID Documento', 'Comprobante', 'Tipo', 'Código Proveedor', 'Proveedor', 'Fecha', 'Moneda', 'Subtotal', 'IGV (18%)', 'Total', 'Estado', 'N° Operación'],
      compras.map(c => [
        c.idDocumento, c.serieCorrelativo, c.tipoDocumento, c.cardCodeSocio, c.razonSocialSocio,
        c.fechaEmision?.slice(0, 10), c.moneda, c.subtotal, c.impuestoIgv,
        c.montoTotal, c.estadoProceso === 'SINCRONIZADO' ? 'COMPLETADO' : c.estadoProceso, c.docEntrySap || '-'
      ])
    );
  };

  const descargarStock = () => {
    exportarCsv(
      'Reporte_Inventario_ERP',
      ['Código Producto', 'Descripción', 'Categoría', 'Unidad', 'Costo Compra', 'Precio Venta', 'Stock Actual', 'Stock Mínimo', 'Estado'],
      productos.map(p => [
        p.itemCode, p.itemName, p.categoria, p.unidadMedida,
        p.precioCompra, p.precioReferencial, p.stockActual, p.stockMinimo, p.estado
      ])
    );
  };

  const descargarSocios = () => {
    exportarCsv(
      'Reporte_Clientes_Proveedores_ERP',
      ['ID', 'Código', 'Tipo', 'RUC/DNI', 'Razón Social', 'Dirección', 'Teléfono', 'Correo', 'Condición Pago', 'Estado'],
      socios.map(s => [
        s.idSocio, s.cardCodeSap, s.cardType === 'C' ? 'CLIENTE' : 'PROVEEDOR',
        s.licTradNum, s.razonSocial, s.direccion, s.telefono, s.correo, s.condicionPago, s.estado
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileSpreadsheet className="text-erpBlue" />
          Centro de Reportes y Exportación Ejecutiva
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Generación y descarga de reportes operativos en formato compatible con Microsoft Excel (.CSV UTF-8).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-gray-50 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 text-erpBlue flex items-center justify-center mb-4">
                <TrendingUp size={24} />
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Reporte de Ventas</h3>
              <p className="text-xs text-gray-500 mt-1">
                Detalle de cotizaciones, pedidos, guías de remisión y facturas emitidas.
              </p>
            </div>
            <button
              onClick={descargarVentas}
              className="mt-6 w-full bg-erpBlue hover:bg-blue-800 text-white py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <Download size={16} /> Descargar Excel (CSV)
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-gray-50 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <ShoppingCart size={24} />
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Reporte de Compras</h3>
              <p className="text-xs text-gray-500 mt-1">
                Órdenes de compra, recepciones de mercadería y facturas de proveedores.
              </p>
            </div>
            <button
              onClick={descargarCompras}
              className="mt-6 w-full bg-purple-700 hover:bg-purple-800 text-white py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <Download size={16} /> Descargar Excel (CSV)
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-gray-50 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Package size={24} />
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Stock e Inventario</h3>
              <p className="text-xs text-gray-500 mt-1">
                Catálogo general de productos con costos, precios de venta, stock actual y alertas.
              </p>
            </div>
            <button
              onClick={descargarStock}
              className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <Download size={16} /> Descargar Excel (CSV)
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition bg-gray-50 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Clientes y Proveedores</h3>
              <p className="text-xs text-gray-500 mt-1">
                Directorio completo de clientes y proveedores con RUC/DNI y dirección fiscal.
              </p>
            </div>
            <button
              onClick={descargarSocios}
              className="mt-6 w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              <Download size={16} /> Descargar Excel (CSV)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
