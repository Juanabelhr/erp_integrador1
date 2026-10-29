import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PlusCircle, Save, ShoppingBag, Trash2, CheckCircle,
  ArrowRightCircle, Link2, X
} from 'lucide-react';

export default function CrearCompra() {
  const hoy = new Date().toISOString().slice(0, 10);
  const en30Dias = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().slice(0, 10);

  const [tipoDocumento, setTipoDocumento] = useState('ORDEN_COMPRA');
  const [idSocio, setIdSocio] = useState('');
  const [moneda, setMoneda] = useState('PEN');
  const [tipoCambio, setTipoCambio] = useState(3.75);
  const [fechaEmision, setFechaEmision] = useState(hoy);
  const [fechaVencimiento, setFechaVencimiento] = useState(en30Dias);
  const [fechaDocumento, setFechaDocumento] = useState(hoy);
  const [condicionPago, setCondicionPago] = useState('FACTURA 30 DIAS');
  const [numAtCard, setNumAtCard] = useState('');
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
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [historialCompras, setHistorialCompras] = useState<any[]>([]);

  const cargarDatos = async () => {
    try {
      const [resP, resProd, resC] = await Promise.all([
        axios.get('/api/v1/socios?cardType=S'),
        axios.get('/api/v1/productos'),
        axios.get('/api/v1/pedidos?tipo=COMPRAS')
      ]);
      setProveedores(resP.data);
      if (resP.data.length > 0 && !idSocio) {
        setIdSocio(String(resP.data[0].idSocio));
        setCondicionPago(resP.data[0].condicionPago || 'FACTURA 30 DIAS');
      }
      setProductos(resProd.data);
      setHistorialCompras(resC.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

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
        idUsuarioCreador: 3,
        fechaEmision: new Date(fechaEmision).toISOString(),
        fechaVencimiento: new Date(fechaVencimiento).toISOString(),
        fechaDocumento: new Date(fechaDocumento).toISOString(),
        moneda,
        tipoCambio: Number(tipoCambio),
        condicionPago,
        numAtCard,
        baseDocId: baseDoc?.id ?? null,
        observaciones,
        detalles
      };

      const res = await axios.post('/api/v1/pedidos', payload);
      const idGenerado = res.data.idDocumento;
      const correlativo = res.data.serieCorrelativo ?? `POD-000${idGenerado}`;
      setMensaje({
        tipo: 'success',
        texto: `${tipoDocumento} (${correlativo}) registrado con éxito en la base de datos local.${
          baseDoc ? ` Vinculado a ${baseDoc.serie}.` : ''
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
        texto: err.response?.data?.message || 'Error al registrar el documento de compra.'
      });
    }
  };

  const copiarASiguienteEtapa = (docOrigen: any, siguienteTipo: string) => {
    setTipoDocumento(siguienteTipo);
    setIdSocio(String(docOrigen.idSocio));
    setMoneda(docOrigen.moneda || 'PEN');
    setTipoCambio(docOrigen.tipoCambio || 3.75);
    setCondicionPago(docOrigen.condicionPago || 'FACTURA 30 DIAS');
    setNumAtCard(docOrigen.numAtCard || '');
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
      texto: `Datos cargados desde ${docOrigen.serieCorrelativo}. Verifique los datos y presione "Registrar ${siguienteTipo}".`
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
      newDetalles[idx].precioUnitario = prod.precioCompra || prod.precioReferencial;
      newDetalles[idx].unidadMedida = prod.unidadMedida || 'NIU';
    }
    setDetalles(newDetalles);
  };

  const etapasCompra = [
    { codigo: 'ORDEN_COMPRA', titulo: '1. Orden de Compra', sub: 'Solicitud formal al proveedor' },
    { codigo: 'ENTRADA_MERCADERIA', titulo: '2. Recepción de Mercadería', sub: 'Guía de ingreso a almacén' },
    { codigo: 'FACTURA_PROVEEDOR', titulo: '3. Factura de Proveedor', sub: 'Registro de comprobante y cuenta por pagar' }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag className="text-erpBlue" /> 
              Módulo de Compras: Orden de Compra → Recepción → Factura
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Gestión de abastecimiento e incremento automático de stock en almacén.
            </p>
          </div>
          <button
            onClick={handleGuardar}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition shadow-sm"
          >
            <Save size={20} /> Registrar {tipoDocumento}
          </button>
        </div>

        {/* Etapas de Compra */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {etapasCompra.map(et => (
            <button
              key={et.codigo}
              type="button"
              onClick={() => setTipoDocumento(et.codigo)}
              className={`p-3 rounded-xl border text-left transition ${
                tipoDocumento === et.codigo
                  ? 'bg-purple-700 text-white border-purple-700 shadow-md'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="font-bold text-sm">{et.titulo}</div>
              <div className={`text-xs mt-0.5 ${tipoDocumento === et.codigo ? 'text-purple-200' : 'text-gray-400'}`}>
                {et.sub}
              </div>
            </button>
          ))}
        </div>

        {baseDoc && (
          <div className="mb-6 p-3.5 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between text-sm text-purple-900">
            <div className="flex items-center gap-2">
              <Link2 size={18} className="text-purple-700" />
              <span>
                <strong>Documento Vinculado:</strong> Generando <strong>{tipoDocumento}</strong> desde{' '}
                <span className="font-mono font-bold underline">{baseDoc.serie}</span> ({baseDoc.tipo})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBaseDoc(null)}
              className="text-xs text-purple-700 hover:text-purple-900 flex items-center gap-1 font-semibold"
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

        {/* Cabecera Compras */}
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Proveedor *</label>
              <select
                value={idSocio}
                onChange={e => setIdSocio(e.target.value)}
                className="w-full border-gray-300 rounded-md p-2 border text-sm focus:border-erpBlue outline-none bg-white"
              >
                {proveedores.map(p => (
                  <option key={p.idSocio} value={p.idSocio}>
                    {p.cardCodeSap} — {p.razonSocial} (RUC: {p.licTradNum})
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
                <option value="PEN">PEN - Soles</option>
                <option value="USD">USD - Dólares</option>
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

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de Registro</label>
              <input
                type="date"
                value={fechaEmision}
                onChange={e => setFechaEmision(e.target.value)}
                className="w-full border-gray-300 rounded-md p-2 border text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de Entrega</label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={e => setFechaVencimiento(e.target.value)}
                className="w-full border-gray-300 rounded-md p-2 border text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Fecha de Emisión</label>
              <input
                type="date"
                value={fechaDocumento}
                onChange={e => setFechaDocumento(e.target.value)}
                className="w-full border-gray-300 rounded-md p-2 border text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Condición de Pago</label>
              <select
                value={condicionPago}
                onChange={e => setCondicionPago(e.target.value)}
                className="w-full border-gray-300 rounded-md p-2 border text-sm bg-white"
              >
                <option value="CONTADO">Contado</option>
                <option value="FACTURA 30 DIAS">Crédito 30 Días</option>
                <option value="FACTURA 45 DIAS">Crédito 45 Días</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">N° Guía / Fact. Proveedor</label>
              <input
                type="text"
                value={numAtCard}
                onChange={e => setNumAtCard(e.target.value)}
                className="w-full border-gray-300 rounded-md p-2 border text-sm bg-white"
                placeholder="Ej. F002-004512"
              />
            </div>
          </div>
        </div>

        {/* Detalle de Líneas */}
        <div className="mb-3 flex justify-between items-end">
          <h3 className="text-lg font-bold text-gray-800">Detalle de Productos Solicitados</h3>
          <button onClick={agregarLinea} className="text-erpBlue font-semibold flex items-center gap-1 hover:underline text-sm">
            <PlusCircle size={18} /> Agregar Producto
          </button>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-xs uppercase">
                <th className="p-2.5 border-b">Producto (Código - Stock Actual)</th>
                <th className="p-2.5 border-b w-24">Almacén</th>
                <th className="p-2.5 border-b w-20">Cant.</th>
                <th className="p-2.5 border-b w-28">Costo Unit.</th>
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
                          {p.itemCode} - {p.itemName} (Stock: {p.stockActual})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      className="w-full p-2 border border-gray-300 rounded text-xs font-mono"
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
                      className="w-full p-2 border border-gray-300 rounded"
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
                      className="w-full p-2 border border-gray-300 rounded"
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
                      className="w-full p-2 border border-gray-300 rounded"
                      value={det.porcentajeDescuento}
                      onChange={e => {
                        const nd = [...detalles];
                        nd[idx].porcentajeDescuento = Number(e.target.value);
                        setDetalles(nd);
                      }}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      className="w-full p-2 border border-gray-300 rounded text-xs font-bold"
                      value={det.taxCode}
                      onChange={e => {
                        const nd = [...detalles];
                        nd[idx].taxCode = e.target.value;
                        setDetalles(nd);
                      }}
                    >
                      <option value="IGV">IGV (18%)</option>
                      <option value="EXO">Exonerado (0%)</option>
                    </select>
                  </td>
                  <td className="p-2 text-right font-semibold bg-gray-50 text-gray-700">
                    {((det.cantidad * det.precioUnitario) * (1 - det.porcentajeDescuento / 100)).toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                    <button type="button" onClick={() => eliminarLinea(idx)} className="text-red-500 hover:text-red-700 p-1">
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
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">{moneda === 'USD' ? '$ ' : 'S/ '}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-600">IGV (18%):</span>
              <span className="font-semibold">{moneda === 'USD' ? '$ ' : 'S/ '}{igv.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-300 text-lg">
              <span className="font-bold text-gray-800">Total Compra:</span>
              <span className="font-bold text-erpBlue">{moneda === 'USD' ? '$ ' : 'S/ '}{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Compras */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Historial y Seguimiento de Compras</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-xs uppercase border-b">
                <th className="p-3">N° Documento</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Proveedor</th>
                <th className="p-3">Doc. Origen</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Siguiente Etapa</th>
              </tr>
            </thead>
            <tbody>
              {historialCompras.map((c: any) => (
                <tr key={c.idDocumento} className="border-b hover:bg-gray-50 text-sm">
                  <td className="p-3 font-mono font-bold text-purple-700">
                    {c.serieCorrelativo || `POD-000${c.idDocumento}`}
                    <span className="block text-xs text-gray-400 font-normal">{c.fechaEmision?.slice(0, 10)}</span>
                  </td>
                  <td className="p-3 font-bold text-xs text-gray-700">{c.tipoDocumento}</td>
                  <td className="p-3 text-gray-800 font-medium">{c.razonSocialSocio}</td>
                  <td className="p-3 font-mono text-xs text-gray-500">{c.baseSerieCorrelativo || '-'}</td>
                  <td className="p-3 text-right font-bold text-gray-800">
                    {c.moneda === 'USD' ? '$ ' : 'S/ '}{Number(c.montoTotal).toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                      <CheckCircle size={13} /> Registrado
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {c.tipoDocumento === 'ORDEN_COMPRA' && (
                      <button
                        onClick={() => copiarASiguienteEtapa(c, 'ENTRADA_MERCADERIA')}
                        className="bg-purple-50 hover:bg-purple-700 text-purple-700 hover:text-white border border-purple-200 px-2.5 py-1 rounded text-xs font-bold inline-flex items-center gap-1 transition"
                      >
                        <ArrowRightCircle size={13} /> Recibir Mercadería
                      </button>
                    )}
                    {c.tipoDocumento === 'ENTRADA_MERCADERIA' && (
                      <button
                        onClick={() => copiarASiguienteEtapa(c, 'FACTURA_PROVEEDOR')}
                        className="bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-200 px-2.5 py-1 rounded text-xs font-bold inline-flex items-center gap-1 transition"
                      >
                        <ArrowRightCircle size={13} /> Registrar Factura
                      </button>
                    )}
                    {c.tipoDocumento === 'FACTURA_PROVEEDOR' && (
                      <span className="text-xs font-bold text-gray-400">Completado ✓</span>
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
