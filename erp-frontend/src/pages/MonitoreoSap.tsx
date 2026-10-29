import { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter, AlertTriangle, CheckCircle, Clock, Info, X, Activity, RefreshCw, Play } from 'lucide-react';

export default function MonitoreoSap() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [modalOpen, setModalOpen] = useState(false);
  const [logSeleccionado, setLogSeleccionado] = useState<any>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const [notificacion, setNotificacion] = useState('');

  const cargarLogs = async () => {
    try {
      const res = await axios.get('/api/v1/integracion/logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarLogs();
  }, []);

  const sincronizarColaCompleta = async () => {
    setSincronizando(true);
    setNotificacion('');
    try {
      const res = await axios.post('/api/v1/integracion/sincronizar-pendientes');
      setNotificacion(res.data.message);
      await cargarLogs();
    } catch (err) {
      console.error(err);
    } finally {
      setSincronizando(false);
    }
  };

  const reintentarIndividual = async (idDocumento: number) => {
    try {
      const res = await axios.post(`/api/v1/integracion/reintentar/${idDocumento}`);
      setNotificacion(res.data.message);
      await cargarLogs();
      if (logSeleccionado && logSeleccionado.idDocumento === idDocumento) {
        setLogSeleccionado(res.data.log);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const logsFiltrados = logs.filter(log => {
    if (filtroEstado !== 'TODOS' && log.estado !== filtroEstado) return false;
    if (filtroTipo !== 'TODOS' && log.tipoDocumento !== filtroTipo) return false;
    return true;
  });

  const abrirDetalle = (log: any) => {
    setLogSeleccionado(log);
    setModalOpen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-erpBlue" />
            Historial de Auditoría de Operaciones
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Control de transacciones registradas, trazabilidad de documentos comerciales y eventos del sistema.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            Sistema Operativo
          </div>

          <button
            onClick={sincronizarColaCompleta}
            disabled={sincronizando}
            className="bg-erpBlue hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition shadow-sm"
          >
            <RefreshCw size={16} className={sincronizando ? 'animate-spin' : ''} />
            {sincronizando ? 'Procesando...' : 'Confirmar Pendientes'}
          </button>
        </div>
      </div>

      {notificacion && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm font-semibold flex items-center justify-between">
          <span>{notificacion}</span>
          <button onClick={() => setNotificacion('')} className="text-green-700 hover:text-green-900">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tipo de Comprobante</label>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="w-full border border-gray-300 rounded text-sm p-2 outline-none focus:border-erpBlue">
            <option value="TODOS">Todos los tipos</option>
            <option value="COTIZACION">Cotización</option>
            <option value="PEDIDO">Pedido de Venta</option>
            <option value="GUIA_REMISION">Guía de Remisión</option>
            <option value="FACTURA">Factura de Venta</option>
            <option value="ORDEN_COMPRA">Orden de Compra</option>
            <option value="ENTRADA_MERCADERIA">Recepción de Mercadería</option>
            <option value="FACTURA_PROVEEDOR">Factura de Proveedor</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Estado de Operación</label>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="w-full border border-gray-300 rounded text-sm p-2 outline-none focus:border-erpBlue">
            <option value="TODOS">Todos los estados</option>
            <option value="PENDIENTE_SINCRONIZACION">Pendiente de Confirmar</option>
            <option value="SINCRONIZADO">Confirmado / Completado</option>
            <option value="ERROR_SINCRONIZACION">Con Observación</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => { setFiltroEstado('TODOS'); setFiltroTipo('TODOS'); cargarLogs(); }}
            className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300 p-2 rounded flex items-center justify-center gap-2 text-sm font-semibold transition"
          >
            <Filter size={16} /> Limpiar Filtros / Actualizar
          </button>
        </div>
      </div>

      {/* Tabla Interactiva */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-xs uppercase">
              <th className="p-3 border-b">N° Documento</th>
              <th className="p-3 border-b">Tipo de Comprobante</th>
              <th className="p-3 border-b">Módulo</th>
              <th className="p-3 border-b">Fecha Registro</th>
              <th className="p-3 border-b">Estado</th>
              <th className="p-3 border-b">N° Operación</th>
              <th className="p-3 border-b text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {logsFiltrados.map((log) => (
              <tr key={log.idLog} className="border-b hover:bg-gray-50 transition text-sm">
                <td className="p-3 font-mono font-bold text-gray-800">#{log.idDocumento}</td>
                <td className="p-3">
                  <span className="font-semibold text-gray-800">{log.tipoDocumento}</span>
                </td>
                <td className="p-3 text-gray-600 text-xs font-medium">{log.objetoSap}</td>
                <td className="p-3 text-gray-500">{log.fechaEjecucion?.replace('T', ' ').slice(0, 19)}</td>
                <td className="p-3">
                  {log.estado === 'SINCRONIZADO' && (
                    <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
                      <CheckCircle size={14}/> Confirmado
                    </span>
                  )}
                  {log.estado === 'PENDIENTE_SINCRONIZACION' && (
                    <span className="bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
                      <Clock size={14}/> Pendiente
                    </span>
                  )}
                  {log.estado === 'ERROR_SINCRONIZACION' && (
                    <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
                      <AlertTriangle size={14}/> Observado
                    </span>
                  )}
                </td>
                <td className="p-3 text-erpBlue font-mono font-bold">{log.docEntrySap || '-'}</td>
                <td className="p-3 text-center flex items-center justify-center gap-2">
                  {log.estado !== 'SINCRONIZADO' && (
                    <button
                      onClick={() => reintentarIndividual(log.idDocumento)}
                      className="bg-blue-50 text-erpBlue hover:bg-erpBlue hover:text-white px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition"
                      title="Confirmar documento ahora"
                    >
                      <Play size={12} /> Confirmar
                    </button>
                  )}
                  <button 
                    onClick={() => abrirDetalle(log)}
                    className="text-erpBlue hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded transition"
                    title="Ver detalle de auditoría"
                  >
                    <Info size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalle Técnico */}
      {modalOpen && logSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className={`p-4 flex justify-between items-center text-white ${
              logSeleccionado.estado === 'ERROR_SINCRONIZACION' ? 'bg-red-600' : 'bg-erpBlue'
            }`}>
              <h3 className="font-bold flex items-center gap-2">
                {logSeleccionado.estado === 'ERROR_SINCRONIZACION' ? <AlertTriangle size={20} /> : <Info size={20} />}
                Detalle de Auditoría de Transacción
              </h3>
              <button onClick={() => setModalOpen(false)} className="hover:bg-white/20 p-1 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">ID Documento Local</p>
                  <p className="font-semibold text-gray-800">#{logSeleccionado.idDocumento}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Tipo Documento</p>
                  <p className="font-semibold text-gray-800 text-sm">{logSeleccionado.tipoDocumento}</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded p-4 font-mono text-sm relative">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-gray-500">Código Retorno:</span> 
                  <span className={`font-bold ${logSeleccionado.errorCode && logSeleccionado.errorCode !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {logSeleccionado.errorCode !== null ? logSeleccionado.errorCode : '0 (En cola)'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 mb-1">Mensaje del Sistema:</span>
                  <span className={`${logSeleccionado.errorCode && logSeleccionado.errorCode !== 0 ? 'text-red-600' : 'text-green-700'} text-xs`}>
                    {logSeleccionado.errorMsg}
                  </span>
                </div>
              </div>

              {logSeleccionado.payloadJson && (
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Estructura de Datos (JSON)</p>
                  <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                    {logSeleccionado.payloadJson}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-t border-gray-100">
              {logSeleccionado.estado !== 'SINCRONIZADO' ? (
                <button
                  onClick={() => reintentarIndividual(logSeleccionado.idDocumento)}
                  className="bg-erpBlue hover:bg-blue-800 text-white px-4 py-2 rounded font-semibold text-sm transition"
                >
                  Reintentar Proceso
                </button>
              ) : <div />}
              <button onClick={() => setModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-semibold text-sm transition">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
