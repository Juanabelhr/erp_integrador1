import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Edit3, AlertTriangle, CheckCircle, X } from 'lucide-react';

export default function Productos() {
  const [productos, setProductos] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);

  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [categoria, setCategoria] = useState('Cómputo');
  const [unidadMedida, setUnidadMedida] = useState('NIU');
  const [precioCompra, setPrecioCompra] = useState(0);
  const [precio, setPrecio] = useState(0);
  const [stockActual, setStockActual] = useState(10);
  const [stockMinimo, setStockMinimo] = useState(5);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const cargarProductos = async () => {
    try {
      const res = await axios.get('/api/v1/productos');
      setProductos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const limpiar = () => {
    setEditMode(false);
    setItemCode('');
    setItemName('');
    setCategoria('Cómputo');
    setUnidadMedida('NIU');
    setPrecioCompra(0);
    setPrecio(0);
    setStockActual(10);
    setStockMinimo(5);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        itemCode,
        itemName,
        categoria,
        unidadMedida,
        precioCompra,
        precioReferencial: precio,
        stockActual,
        stockMinimo,
        estado: 'ACTIVO'
      };

      if (editMode) {
        await axios.put(`/api/v1/productos/${itemCode}`, payload);
        setMensaje({ tipo: 'success', texto: `Producto ${itemCode} actualizado en el inventario.` });
      } else {
        await axios.post('/api/v1/productos', payload);
        setMensaje({ tipo: 'success', texto: 'Producto registrado exitosamente en el catálogo.' });
      }
      limpiar();
      cargarProductos();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error al guardar el producto' });
    }
  };

  const seleccionarParaEditar = (p: any) => {
    setEditMode(true);
    setItemCode(p.itemCode);
    setItemName(p.itemName);
    setCategoria(p.categoria || 'Cómputo');
    setUnidadMedida(p.unidadMedida || 'NIU');
    setPrecioCompra(p.precioCompra || 0);
    setPrecio(p.precioReferencial || 0);
    setStockActual(p.stockActual ?? 0);
    setStockMinimo(p.stockMinimo ?? 5);
    setMensaje({ tipo: '', texto: '' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {editMode ? `Editar Producto (${itemCode})` : 'Registrar Producto'}
          </h2>
          {editMode && (
            <button onClick={limpiar} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
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
            <label className="block text-sm font-bold text-gray-700 mb-1">Código de Producto</label>
            <input
              type="text"
              required
              disabled={editMode}
              value={itemCode}
              onChange={e => setItemCode(e.target.value.toUpperCase())}
              className="w-full border border-gray-300 p-2 rounded font-mono"
              placeholder="Ej: ART-008"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre / Descripción</label>
            <input
              type="text"
              required
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
              placeholder="Ej: Laptop Corporativa Core i7"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Categoría</label>
              <input
                type="text"
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Unidad de Medida</label>
              <select
                value={unidadMedida}
                onChange={e => setUnidadMedida(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded text-sm"
              >
                <option value="NIU">NIU (Unidad)</option>
                <option value="CAJ">CAJ (Caja)</option>
                <option value="KGM">KGM (Kilos)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Costo Compra (S/)</label>
              <input
                type="number"
                step="0.01"
                required
                value={precioCompra}
                onChange={e => setPrecioCompra(Number(e.target.value))}
                className="w-full border border-gray-300 p-2 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Precio Venta (S/)</label>
              <input
                type="number"
                step="0.01"
                required
                value={precio}
                onChange={e => setPrecio(Number(e.target.value))}
                className="w-full border border-gray-300 p-2 rounded text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Stock Actual</label>
              <input
                type="number"
                required
                value={stockActual}
                onChange={e => setStockActual(Number(e.target.value))}
                className="w-full border border-gray-300 p-2 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Stock Mínimo</label>
              <input
                type="number"
                required
                value={stockMinimo}
                onChange={e => setStockMinimo(Number(e.target.value))}
                className="w-full border border-gray-300 p-2 rounded text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-erpBlue text-white p-2.5 rounded-lg hover:bg-blue-800 flex justify-center items-center gap-2 font-semibold transition"
          >
            <Save size={18}/> {editMode ? 'Actualizar Producto' : 'Guardar Producto'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Catálogo de Productos y Control de Stock</h2>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-xs uppercase text-gray-700 border-b">
                <th className="p-3">Código</th>
                <th className="p-3">Descripción</th>
                <th className="p-3 text-right">Costo</th>
                <th className="p-3 text-right">Precio Venta</th>
                <th className="p-3 text-center">Stock</th>
                <th className="p-3 text-center">Estado Stock</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p, i) => {
                const alertaBajo = p.stockActual <= p.stockMinimo;
                return (
                  <tr key={i} className="border-b hover:bg-gray-50 text-sm">
                    <td className="p-3 font-mono font-bold text-erpBlue">{p.itemCode}</td>
                    <td className="p-3 font-medium text-gray-800">
                      {p.itemName}
                      <span className="block text-xs text-gray-400">{p.categoria} · {p.unidadMedida}</span>
                    </td>
                    <td className="p-3 text-right text-gray-600">S/ {Number(p.precioCompra || 0).toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-gray-800">S/ {Number(p.precioReferencial).toFixed(2)}</td>
                    <td className="p-3 text-center font-bold">{p.stockActual}</td>
                    <td className="p-3 text-center">
                      {alertaBajo ? (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1">
                          <AlertTriangle size={12} /> Stock Bajo (Mín {p.stockMinimo})
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-bold inline-flex items-center gap-1">
                          <CheckCircle size={12} /> Óptimo
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => seleccionarParaEditar(p)}
                        className="text-erpBlue hover:bg-blue-50 p-1.5 rounded transition"
                        title="Editar producto y stock"
                      >
                        <Edit3 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
