import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PlusCircle, Save, ShoppingCart, Trash2, CheckCircle,
  ArrowRightCircle, Link2, X
} from 'lucide-react';

export default function CrearPedido() {
  const hoy = new Date().toISOString().slice(0, 10);
  const en30Dias = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().slice(0, 10);

  const [tipoDocumento, setTipoDocumento] = useState('COTIZACION');
  const [idSocio, setIdSocio] = useState('');
  const [moneda, setMoneda] = useState('PEN');
  const [tipoCambio, setTipoCambio] = useState(3.75);
  const [fechaEmision, setFechaEmision] = useState(hoy);
  const [fechaVencimiento, setFechaVencimiento] = useState(en30Dias);
  const [fechaDocumento, setFechaDocumento] = useState(hoy);
  const [condicionPago, setCondicionPago] = useState('CONTADO');
  const [slpCode, setSlpCode] = useState(1);
  const [numAtCard, setNumAtCard] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [transportista, setTransportista] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [baseDoc, setBaseDoc] = useState<{ id: number; serie: string; tipo: string } | null>(null);

  const [detalles, setDetalles] = useState([
    {
      itemCode: '',
      descripcionItem: '',
      cantidad: 1,
      precioUnitario: 0,
      porcentajeDescuento: 0,
      taxCode: 'IGV',
      unidadMedida: 'NIU',
      idAlmacen: 'ALM01'
    }
  ]);

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [clientes, setClientes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [historialVentas, setHistorialVentas] = useState<any[]>([]);

  const cargarDatos = async () => {
    try {
      const [resC, resP, resV] = await Promise.all([
        axios.get('/api/v1/socios?cardType=C'),
        axios.get('/api/v1/productos'),
        axios.get('/api/v1/pedidos?tipo=VENTAS')
      ]);
      setClientes(resC.data);
      if (resC.data.length > 0 && !idSocio) {
        setIdSocio(String(resC.data[0].idSocio));
        setCondicionPago(resC.data[0].condicionPago || 'CONTADO');
        setDireccionEntrega(resC.data[0].direccion || '');
      }
      setProductos(resP.data);
      setHistorialVentas(resV.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSocioChange = (nuevoId: string) => {
    setIdSocio(nuevoId);
    const cli = clientes.find(c => String(c.idSocio) === nuevoId);
    if (cli) {
      setCondicionPago(cli.condicionPago || 'CONTADO');
      setDireccionEntrega(cli.direccion || '');
    }
  };

  const calcularTotal = () => {
    let sub = 0;
    let igv = 0;
    detalles.forEach(d => {
      const linea = (d.cantidad * d.precioUnitario) * (1 - d.porcentajeDescuento / 100);
      sub += linea;
      if (d.taxCode === 'IGV') {
        igv += linea * 0.18;
      }
    });
    return { subtotal: sub, igv, total: sub + igv };
  };

  const { subtotal, igv, total } = calcularTotal();

  const handleGuardar = async () => {
    setMensaje({ tipo: '', texto: '' });
    try {
      const payload = {
        tipoDocumento,
        idSocio: Number(idSocio),
        idUsuarioCreador: 1,
        fechaEmision: new Date(fechaEmision).toISOString(),
        fechaVencimiento: new Date(fechaVencimiento).toISOString(),
        fechaDocumento: new Date(fechaDocumento).toISOString(),
        moneda,
        tipoCambio: Number(tipoCambio),
        condicionPago,
        slpCode: Number(slpCode),
        numAtCard,
        direccionEntrega,
        transportista,
        baseDocId: baseDoc?.id ?? null,
        observaciones,
        detalles
      };

      const res = await axios.post('/api/v1/pedidos', payload);
      const idGenerado = res.data.idDocumento;
      const correlativo = res.data.serieCorrelativo ?? `#${idGenerado}`;
      setMensaje({
        tipo: 'success',
        texto: `${tipoDocumento} (${correlativo}) registrado exitosamente en la base de datos local.${
          baseDoc ? ` Generado a partir de ${baseDoc.serie}.` : ''
        }`
      });
      setBaseDoc(null);
      setNumAtCard('');
      setObservaciones('');
      setDetalles([
        {
          itemCode: '',
          descripcionItem: '',
          cantidad: 1,
          precioUnitario: 0,
          porcentajeDescuento: 0,
          taxCode: 'IGV',
          unidadMedida: 'NIU',
          idAlmacen: 'ALM01'
        }
      ]);
      await cargarDatos();
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err.response?.data?.message || 'Error al registrar el documento comercial.'
      });
    }
  };

  const copiarASiguienteEtapa = (docOrigen: any, siguienteTipo: string) => {
    setTipoDocumento(siguienteTipo);
    setIdSocio(String(docOrigen.idSocio));
    setMoneda(docOrigen.moneda || 'PEN');
    setTipoCambio(docOrigen.tipoCambio || 3.75);
    setCondicionPago(docOrigen.condicionPago || 'CONTADO');
    setSlpCode(docOrigen.slpCode || 1);
    setNumAtCard(docOrigen.numAtCard || '');
    setDireccionEntrega(docOrigen.direccionEntrega || '');
    setObservaciones(`Generado desde ${docOrigen.tipoDocumento} ${docOrigen.serieCorrelativo}`);
    setBaseDoc({
      id: docOrigen.idDocumento,
      serie: docOrigen.serieCorrelativo,
      tipo: docOrigen.tipoDocumento
    });

    if (docOrigen.detalles && docOrigen.detalles.length > 0) {
      setDetalles(
        docOrigen.detalles.map((d: any) => ({
          itemCode: d.itemCode,
          descripcionItem: d.descripcionItem,
          cantidad: d.cantidad,
          precioUnitario: d.precioUnitario,
          porcentajeDescuento: d.porcentajeDescuento || 0,
          taxCode: d.taxCode || 'IGV',
          unidadMedida: d.unidadMedida || 'NIU',
          idAlmacen: d.idAlmacen || 'ALM01'
        }))
      );
    }

    setMensaje({
      tipo: 'success',
      texto: `Datos cargados desde ${docOrigen.serieCorrelativo}. Verifique las fechas y cantidades y presione "Emitir ${siguienteTipo}".`
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const agregarLinea = () => {
    setDetalles([
      ...detalles,
      {
        itemCode: '',
        descripcionItem: '',
        cantidad: 1,
        precioUnitario: 0,
        porcentajeDescuento: 0,
        taxCode: 'IGV',
        unidadMedida: 'NIU',
        idAlmacen: 'ALM01'
      }
    ]);
  };

  const eliminarLinea = (idx: number) => {
    if (detalles.length <= 1) return;
    setDetalles(detalles.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, itemCode: string) => {
    const prod = productos.find(p => p.itemCode === itemCode);
    const newDetalles = [...detalles];
    newDetalles[idx].itemCode = itemCode;
    if (prod) {
      newDetalles[idx].descripcionItem = prod.itemName;
      newDetalles[idx].precioUnitario = prod.precioReferencial;
      newDetalles[idx].unidadMedida = prod.unidadMedida || 'NIU';
    }
    setDetalles(newDetalles);
  };

  const etapas = [
    { codigo: 'COTIZACION', titulo: '1. Cotización', sub: 'Oferta comercial al cliente' },
    { codigo: 'PEDIDO', titulo: '2. Pedido de Venta', sub: 'Reserva de mercadería' },
    { codigo: 'GUIA_REMISION', titulo: '3. Guía de Remisión', sub: 'Despacho y salida de almacén' },
    { codigo: 'FACTURA', titulo: '4. Factura de Venta', sub: 'Comprobante de pago y cobro' }
  ];

  return (
    <div className="space-y-8">
      {/* Formulario de Ventas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingCart className="text-erpBlue" /> 
              Módulo de Ventas: Cotización → Pedido → Guía → Factura
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Gestión integral del ciclo de venta con control de stock, impuestos y trazabilidad de documentos.
            </p>
          </div>
          <button
            onClick={handleGuardar}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition shadow-sm"
          >
            <Save size={20} /> Emitir {tipoDocumento}
          </button>
        </div>

        {/* Barra de Etapas del Flujo Comercial */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {etapas.map(et => (
            <button
              key={et.codigo}
              type="button"
              onClick={() => setTipoDocumento(et.codigo)}
              className={`p-3 rounded-xl border text-left transition ${
                tipoDocumento === et.codigo
                  ? 'bg-erpBlue text-white border-erpBlue shadow-md'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="font-bold text-sm">{et.titulo}</div>
              <div className={`text-xs mt-0.5 ${tipoDocumento === et.codigo ? 'text-blue-200' : 'text-gray-400'}`}>
                {et.sub}
              </div>
            </button>
          ))}
        </div>

        {/* Banner de Documento Origen */}
        {baseDoc && (
          <div className="mb-6 p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-sm text-blue-900">
            <div className="flex items-center gap-2">
              <Link2 size={18} className="text-erpBlue" />
              <span>
                <strong>Documento Vinculado:</strong> Generando <strong>{tipoDocumento}</strong> a partir de{' '}
                <span className="font-mono font-bold underline">{baseDoc.serie}</span> ({baseDoc.tipo})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBaseDoc(null)}
              className="text-xs text-blue-700 hover:text-blue-900 flex items-center gap-1 font-semibold"
            >
              <X size={14} /> Desvincular
            </button>
          </div>
        )}

        {mensaje.texto && (
          <div className={`p-4 mb-6 rounded-lg font-medium text-sm ${
            mensaje.tipo === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {mensaje.texto}
          </div>
        )}

        {/* Cabecera del Documento */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-6 space-y-4">
          <div className="text-xs font-extrabold uppercase text-gray-500 tracking-wider border-b border-gray-200 pb-2">
            Información de Cabecera del Comprobante
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Cliente (Código / RUC / Razón Social) *</label>
              <select
                value={idSocio}
                onChange={e => handleSocioChange(e.target.value)}
                className="w-full border-gray-300 rounded-md p-2 border text-sm focus:border-erpBlue outline-none bg-white"
              >
                {clientes.map(c => (
                  <option key={c.idSocio} value={c.idSocio}>
                    {c.cardCodeSap} — {c.razonSocial} (RUC: {c.licTradNum})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Moneda *</label>
              <select
                value={moneda}
                onChange={e => setMoneda(e.target.value)}
                className="w-full border-gray-300 rounded-md p-2 border text-sm focus:border-erpBlue outline-none bg-white"
              >
                <option value="PEN">PEN - Soles Peruanos</option>
                <option value="USD">USD - Dólares Americanos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Cambio</label>
              <input
                type="number"
                step="0.001"
                value={tipoCambio}
                onChange={e => setTipoCambio(Number(e.target.value))}
                className="w-full border-gray-300 rounded-md p-2 border text-sm focus:border-erpBlue outline-none bg-white font-mono"
              />
            </div>
          </div>

          {/* Fechas, Condición de Pago y Vendedor */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de Registro *</label>
              <input
                type="date"
                value={fechaEmision}
                onChange={e => setFechaEmision(e.target.value)}
                className="w-full border-gray-300 rounded-md p-2 border text-sm focus:border-erpBlue outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {tipoDocumento === 'COTIZACION' ? 'Válido Hasta *' : 'Fecha de Entrega / Venc. *'}
              </label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={e => setFechaVencimiento(e.target.value)}
                className="w-full border-gray-300 rounded-md p-2 border text-sm focus:border-erpBlue outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de Emisión *</label>
              <input
                type="date"
                value={fechaDocumento}
                onChange={e => setFechaDocumento(e.target.value)}
                className="w-full border-gray-300 rounded-md p-2 border text-sm focus:border-erpBlue outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Condición de Pago</label>
              <select
                value={condicionPago}
                onChange={e => setCondicionPago(e.target.value)}
                className="w-full border-gray-300 rounded-md p-2 border text-sm focus:border-erpBlue outline-none bg-white"
              >
                <option value="CONTADO">Contado</option>
                <option value="FACTURA 15 DIAS">Crédito 15 Días</option>
                <option value="FACTURA 30 DIAS">Crédito 30 Días</option>
                <option value="FACTURA 45 DIAS">Crédito 45 Días</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Vendedor Responsable</label>
              <select
                value={slpCode}
                onChange={e => setSlpCode(Number(e.target.value))}
                className="w-full border-gray-300 rounded-md p-2 border text-sm focus:border-erpBlue outline-none bg-white"
              >
                <option value={1}>Juan Abel Huaman</option>
                <option value={2}>Lorena Damián Salas</option>
                <option value={3}>Ventas Corporativas</option>
              </select>
            </div>
          </div>

          {/* Referencia Cliente, Dirección Despacho y Comentarios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">N° Orden / Referencia del Cliente</label>
              <input
                type="text"
                value={numAtCard}
                onChange={e => setNumAtCard(e.target.value)}
                className="w-full border-gray-300 rounded-md p-2 border text-sm focus:border-erpBlue outline-none bg-white"
                placeholder="Ej. OC-CLI-2026-089"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Dirección de Entrega / Despacho</label>
              <input
                type="text"
                value={direccionEntrega}
                onChange={e => setDireccionEntrega(e.target.value)}
                className="w-full border-gray-300 rounded-md p-2 border text-sm focus:border-erpBlue outline-none bg-white"
                placeholder="Punto de llegada de mercadería..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {tipoDocumento === 'GUIA_REMISION' ? 'Transportista y Placa de Vehículo' : 'Observaciones / Comentarios'}
              </label>
              {tipoDocumento === 'GUIA_REMISION' ? (
                <input
                  type="text"
                  value={transportista}
                  onChange={e => setTransportista(e.target.value)}
                  className="w-full border-gray-300 rounded-md p-2 border text-sm focus:border-erpBlue outline-none bg-white"
                  placeholder="Ej. RUC 20501122334 - Placa BXK-842"
                />
              ) : (
                <input
                  type="text"
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  className="w-full border-gray-300 rounded-md p-2 border text-sm focus:border-erpBlue outline-none bg-white"
                  placeholder="Observaciones adicionales de la operación..."
                />
              )}
            </div>
          </div>
        </div>

        {/* Detalle de Productos */}
        <div className="mb-3 flex justify-between items-end">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Detalle de Productos</h3>
            <p className="text-xs text-gray-500">Seleccione los productos, almacén de despacho, cantidad, descuento e impuesto aplicable.</p>
          </div>
          <button onClick={agregarLinea} className="text-erpBlue font-semibold flex items-center gap-1 hover:underline text-sm">
            <PlusCircle size={18} /> Agregar Producto
          </button>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-xs uppercase">
                <th className="p-2.5 border-b">Producto (Código - Stock Disponible)</th>
                <th className="p-2.5 border-b w-24">Almacén</th>
                <th className="p-2.5 border-b w-20">Cant.</th>
                <th className="p-2.5 border-b w-28">Precio Unit.</th>
                <th className="p-2.5 border-b w-20">% Desc.</th>
                <th className="p-2.5 border-b w-28">Impuesto</th>
                <th className="p-2.5 border-b w-28 text-right">Subtotal</th>
                <th className="p-2.5 border-b w-10 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((det, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50 transition text-sm">
                  <td className="p-2">
                    <select 
                      className="w-full p-2 border border-gray-300 rounded outline-none focus:border-erpBlue text-sm"
                      value={det.itemCode}
                      onChange={e => handleItemChange(idx, e.target.value)}
                    >
                      <option value="">-- Seleccionar Producto --</option>
                      {productos.map(p => (
                        <option key={p.itemCode} value={p.itemCode}>
                          {p.itemCode} - {p.itemName} (Stock: {p.stockActual} {p.unidadMedida})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      className="w-full p-2 border border-gray-300 rounded outline-none focus:border-erpBlue text-xs font-mono"
                      value={det.idAlmacen}
                      onChange={e => {
                        const nd = [...detalles];
                        nd[idx].idAlmacen = e.target.value;
                        setDetalles(nd);
                      }}
                    >
                      <option value="ALM01">ALM01</option>
                      <option value="ALM02">ALM02</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded outline-none focus:border-erpBlue"
                      value={det.cantidad}
                      onChange={e => {
                        const nd = [...detalles];
                        nd[idx].cantidad = Number(e.target.value);
                        setDetalles(nd);
                      }}
                      min="1"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded outline-none focus:border-erpBlue"
                      value={det.precioUnitario}
                      onChange={e => {
                        const nd = [...detalles];
                        nd[idx].precioUnitario = Number(e.target.value);
                        setDetalles(nd);
                      }}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded outline-none focus:border-erpBlue"
                      value={det.porcentajeDescuento}
                      onChange={e => {
                        const nd = [...detalles];
                        nd[idx].porcentajeDescuento = Number(e.target.value);
                        setDetalles(nd);
                      }}
                      min="0"
                      max="100"
                    />
                  </td>
                  <td className="p-2">
                    <select
                      className="w-full p-2 border border-gray-300 rounded outline-none focus:border-erpBlue text-xs font-bold"
                      value={det.taxCode}
                      onChange={e => {
                        const nd = [...detalles];
                        nd[idx].taxCode = e.target.value;
                        setDetalles(nd);
                      }}
                    >
                      <option value="IGV">IGV (18%)</option>
                      <option value="EXO">Exonerado (0%)</option>
                      <option value="INA">Inafecto (0%)</option>
                    </select>
                  </td>
                  <td className="p-2 text-right font-semibold bg-gray-50 text-gray-700">
                    {((det.cantidad * det.precioUnitario) * (1 - det.porcentajeDescuento / 100)).toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => eliminarLinea(idx)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Quitar línea"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="flex justify-end mt-6">
          <div className="w-80 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-600">Subtotal Neto:</span>
              <span className="font-semibold">{moneda === 'USD' ? '$ ' : 'S/ '}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-600">IGV (18%):</span>
              <span className="font-semibold">{moneda === 'USD' ? '$ ' : 'S/ '}{igv.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-300 text-lg">
              <span className="font-bold text-gray-800">Importe Total:</span>
              <span className="font-bold text-erpBlue">{moneda === 'USD' ? '$ ' : 'S/ '}{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historial y Conversión de Documentos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800">
             Historial de Documentos de Venta y Seguimiento Comercial
          </h3>
          <p className="text-xs text-gray-500">
            Utilice la columna <strong>Siguiente Etapa</strong> para convertir una <strong>Cotización → Pedido → Guía de Remisión → Factura</strong> conservando los datos del cliente y productos.
          </p>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-xs uppercase border-b">
                <th className="p-3">N° Comprobante</th>
                <th className="p-3">Tipo Documento</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Doc. Origen</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Siguiente Etapa</th>
              </tr>
            </thead>
            <tbody>
              {historialVentas.map((v: any) => (
                <tr key={v.idDocumento} className="border-b hover:bg-gray-50 text-sm">
                  <td className="p-3 font-mono font-bold text-erpBlue">
                    {v.serieCorrelativo || `#${v.idDocumento}`}
                    <span className="block text-xs text-gray-400 font-normal">{v.fechaEmision?.slice(0, 10)}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      v.tipoDocumento === 'COTIZACION'
                        ? 'bg-sky-100 text-sky-800'
                        : v.tipoDocumento === 'PEDIDO'
                        ? 'bg-indigo-100 text-indigo-800'
                        : v.tipoDocumento === 'GUIA_REMISION'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {v.tipoDocumento}
                    </span>
                  </td>
                  <td className="p-3 text-gray-800">
                    {v.razonSocialSocio}
                    <span className="block text-xs text-gray-400 font-mono">{v.cardCodeSocio} · {v.condicionPago}</span>
                  </td>
                  <td className="p-3 font-mono text-xs text-gray-500">
                    {v.baseSerieCorrelativo ? (
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-300">
                        ← {v.baseSerieCorrelativo}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="p-3 text-right font-bold text-gray-800">
                    {v.moneda === 'USD' ? '$ ' : 'S/ '}{Number(v.montoTotal).toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                      <CheckCircle size={13} /> Registrado
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {v.tipoDocumento === 'COTIZACION' && (
                      <button
                        onClick={() => copiarASiguienteEtapa(v, 'PEDIDO')}
                        className="bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 px-2.5 py-1 rounded text-xs font-bold inline-flex items-center gap-1 transition"
                      >
                        <ArrowRightCircle size={13} /> Pasar a Pedido
                      </button>
                    )}
                    {v.tipoDocumento === 'PEDIDO' && (
                      <button
                        onClick={() => copiarASiguienteEtapa(v, 'GUIA_REMISION')}
                        className="bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-200 px-2.5 py-1 rounded text-xs font-bold inline-flex items-center gap-1 transition"
                      >
                        <ArrowRightCircle size={13} /> Generar Guía
                      </button>
                    )}
                    {v.tipoDocumento === 'GUIA_REMISION' && (
                      <button
                        onClick={() => copiarASiguienteEtapa(v, 'FACTURA')}
                        className="bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-200 px-2.5 py-1 rounded text-xs font-bold inline-flex items-center gap-1 transition"
                      >
                        <ArrowRightCircle size={13} /> Emitir Factura
                      </button>
                    )}
                    {v.tipoDocumento === 'FACTURA' && (
                      <span className="text-xs font-bold text-gray-400">Facturado ✓</span>
                    )}
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
