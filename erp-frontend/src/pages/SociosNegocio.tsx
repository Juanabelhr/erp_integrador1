import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Search, Loader2, MapPin, Edit3, X } from 'lucide-react';

export default function SociosNegocio() {
  const [socios, setSocios] = useState<any[]>([]);
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');

  const [editId, setEditId] = useState<number | null>(null);
  const [cardCode, setCardCode] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [cardType, setCardType] = useState('C');
  const [licTradNum, setLicTradNum] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [condicionPago, setCondicionPago] = useState('CONTADO');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [buscando, setBuscando] = useState(false);

  const cargarSocios = async () => {
    try {
      const res = await axios.get('/api/v1/socios');
      setSocios(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarSocios();
  }, []);

  const buscarRuc = async () => {
    if (!licTradNum || (licTradNum.length !== 11 && licTradNum.length !== 8)) {
      setMensaje({ tipo: 'error', texto: 'Ingrese un RUC de 11 dígitos o DNI de 8 dígitos.' });
      return;
    }

    setBuscando(true);
    setMensaje({ tipo: '', texto: '' });
    try {
      const res = await axios.get(`/api/v1/socios/consultar-ruc/${licTradNum}`);
      if (res.data && res.data.nombre_o_razonsocial) {
        setRazonSocial(res.data.nombre_o_razonsocial);
        setCardCode((cardType === 'C' ? 'CLI-' : 'PRV-') + licTradNum);
        const dir = [res.data.direccion, res.data.distrito, res.data.provincia, res.data.departamento]
          .filter(Boolean)
          .join(', ');
        setDireccion(dir);
        const fuente = res.data.origen === 'API_SUNAT_VIVO' ? ' (SUNAT en Vivo)' : '';
        setMensaje({ tipo: 'success', texto: `Validación Exitosa${fuente} — ${res.data.estado_del_contribuyente} (${res.data.condicion_de_domicilio})` });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'No se pudo consultar el documento.' });
    } finally {
      setBuscando(false);
    }
  };

  const limpiarFormulario = () => {
    setEditId(null);
    setCardCode('');
    setRazonSocial('');
    setLicTradNum('');
    setDireccion('');
    setTelefono('');
    setCorreo('');
    setCondicionPago('CONTADO');
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const codigoFinal = cardCode || ((cardType === 'C' ? 'CLI-' : 'PRV-') + licTradNum);
      if (editId) {
        await axios.put(`/api/v1/socios/${editId}`, {
          idSocio: editId,
          cardCodeSap: codigoFinal,
          razonSocial,
          cardType,
          licTradNum,
          direccion,
          telefono,
          correo,
          condicionPago,
          estado: 'ACTIVO'
        });
        setMensaje({ tipo: 'success', texto: 'Datos del socio actualizados correctamente.' });
      } else {
        await axios.post('/api/v1/socios', {
          cardCodeSap: codigoFinal,
          razonSocial,
          cardType,
          licTradNum,
          direccion,
          telefono,
          correo,
          condicionPago,
          estado: 'ACTIVO'
        });
        setMensaje({ tipo: 'success', texto: 'Cliente / Proveedor registrado exitosamente.' });
      }
      limpiarFormulario();
      cargarSocios();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error al guardar el registro' });
    }
  };

  const cargarParaEditar = (s: any) => {
    setEditId(s.idSocio);
    setCardType(s.cardType);
    setLicTradNum(s.licTradNum);
    setRazonSocial(s.razonSocial);
    setCardCode(s.cardCodeSap);
    setDireccion(s.direccion || '');
    setTelefono(s.telefono || '');
    setCorreo(s.correo || '');
    setCondicionPago(s.condicionPago || 'CONTADO');
    setMensaje({ tipo: '', texto: '' });
  };

  const sociosFiltrados = socios.filter(s => {
    if (filtroTipo !== 'TODOS' && s.cardType !== filtroTipo) return false;
    if (busqueda.trim() !== '') {
      const q = busqueda.toLowerCase();
      return (
        s.razonSocial?.toLowerCase().includes(q) ||
        s.licTradNum?.toLowerCase().includes(q) ||
        s.cardCodeSap?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulario Crear / Editar Socio */}
      <div className="col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {editId ? 'Editar Cliente / Proveedor' : 'Registrar Cliente / Proveedor'}
          </h2>
          {editId && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
            >
              <X size={14} /> Cancelar
            </button>
          )}
        </div>

        {mensaje.texto && (
          <div className={`p-3 mb-4 rounded text-sm ${
            mensaje.tipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Registro</label>
            <select
              value={cardType}
              onChange={e => {
                setCardType(e.target.value);
                if (licTradNum) setCardCode((e.target.value === 'C' ? 'CLI-' : 'PRV-') + licTradNum);
              }}
              className="w-full border border-gray-300 p-2 rounded focus:border-erpBlue outline-none"
            >
              <option value="C">Cliente (Ventas)</option>
              <option value="S">Proveedor (Compras)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">RUC (11 dígitos) / DNI (8 dígitos)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                required 
                value={licTradNum} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setLicTradNum(val);
                  setCardCode((cardType === 'C' ? 'CLI-' : 'PRV-') + val);
                }} 
                maxLength={11} 
                className="w-full border border-gray-300 p-2 rounded focus:border-erpBlue outline-none" 
                placeholder="Ej: 20427919111"
              />
              <button
                type="button"
                onClick={buscarRuc}
                disabled={buscando}
                className="bg-erpBlue hover:bg-blue-800 text-white px-3 py-2 rounded flex items-center gap-1 transition"
                title="Consultar RUC en API"
              >
                {buscando ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Razón Social / Nombre Completo</label>
            <input 
              type="text" 
              required 
              value={razonSocial} 
              onChange={e => setRazonSocial(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:border-erpBlue outline-none" 
              placeholder="Razón Social del cliente o proveedor"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1">
              <MapPin size={14} className="text-erpBlue" /> Dirección Fiscal
            </label>
            <input 
              type="text" 
              value={direccion} 
              onChange={e => setDireccion(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:border-erpBlue outline-none text-sm" 
              placeholder="Av. / Calle / Distrito / Lima"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Teléfono</label>
              <input
                type="text"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:border-erpBlue outline-none text-sm"
                placeholder="987654321"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Condición de Pago</label>
              <select
                value={condicionPago}
                onChange={e => setCondicionPago(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:border-erpBlue outline-none text-sm"
              >
                <option value="CONTADO">Contado</option>
                <option value="FACTURA 15 DIAS">Crédito 15 Días</option>
                <option value="FACTURA 30 DIAS">Crédito 30 Días</option>
                <option value="FACTURA 45 DIAS">Crédito 45 Días</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Código Interno</label>
            <input 
              type="text" 
              required 
              value={cardCode} 
              onChange={e => setCardCode(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded bg-gray-50 font-mono text-sm text-erpBlue font-bold" 
              placeholder="Autogenerado"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-erpBlue text-white p-2.5 rounded-lg hover:bg-blue-800 flex justify-center items-center gap-2 font-semibold transition"
          >
            <Save size={18}/> {editId ? 'Actualizar Datos' : 'Guardar Registro'}
          </button>
        </form>
      </div>

      {/* Directorio de Clientes y Proveedores */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-gray-800">Directorio de Clientes y Proveedores</h2>
          <div className="flex gap-2">
            {(['TODOS', 'C', 'S'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filtroTipo === t ? 'bg-erpBlue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t === 'TODOS' ? 'Todos' : t === 'C' ? 'Clientes' : 'Proveedores'}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar cliente o proveedor por Razón Social, RUC o Código..."
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-erpBlue"
          />
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-xs uppercase text-gray-700 border-b">
                <th className="p-3">Código</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Razón Social</th>
                <th className="p-3">RUC/DNI</th>
                <th className="p-3 hidden xl:table-cell">Dirección</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {sociosFiltrados.map((s) => (
                <tr key={s.idSocio} className="border-b hover:bg-gray-50 text-sm">
                  <td className="p-3 font-mono font-bold text-erpBlue">{s.cardCodeSap}</td>
                  <td className="p-3">
                    {s.cardType === 'C' ? (
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">Cliente</span>
                    ) : (
                      <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-bold">Proveedor</span>
                    )}
                  </td>
                  <td className="p-3 font-medium text-gray-800">{s.razonSocial}</td>
                  <td className="p-3 font-mono text-gray-600">{s.licTradNum}</td>
                  <td className="p-3 hidden xl:table-cell text-gray-500 truncate max-w-xs" title={s.direccion}>
                    {s.direccion || '-'}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => cargarParaEditar(s)}
                      className="text-erpBlue hover:bg-blue-50 p-1.5 rounded transition"
                      title="Editar registro"
                    >
                      <Edit3 size={16} />
                    </button>
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
