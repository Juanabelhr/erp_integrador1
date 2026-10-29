import { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, UserPlus, Power, Lock } from 'lucide-react';

export default function UsuariosRoles() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [idRol, setIdRol] = useState(2);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const cargarDatos = async () => {
    try {
      const [resU, resR] = await Promise.all([
        axios.get('/api/v1/auth/usuarios'),
        axios.get('/api/v1/auth/roles')
      ]);
      setUsuarios(resU.data);
      setRoles(resR.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/v1/auth/usuarios', {
        nombres,
        apellidos,
        email,
        password,
        idRol: Number(idRol),
        estado: 'ACTIVO'
      });
      setMensaje({ tipo: 'success', texto: 'Usuario creado exitosamente con contraseña encriptada (BCrypt) y rol asignado.' });
      setNombres('');
      setApellidos('');
      setEmail('');
      setPassword('123456');
      cargarDatos();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error al registrar usuario.' });
    }
  };

  const toggleEstado = async (id: number) => {
    try {
      await axios.put(`/api/v1/auth/usuarios/${id}/estado`);
      cargarDatos();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario Creación Usuario */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <UserPlus className="text-erpBlue" size={22} />
            Registrar Nuevo Usuario
          </h2>

          {mensaje.texto && (
            <div className={`p-3 mb-4 rounded text-sm ${mensaje.tipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {mensaje.texto}
            </div>
          )}

          <form onSubmit={handleCrear} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombres</label>
              <input
                type="text"
                required
                value={nombres}
                onChange={e => setNombres(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:border-erpBlue outline-none"
                placeholder="Ej. Carlos Alberto"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Apellidos</label>
              <input
                type="text"
                required
                value={apellidos}
                onChange={e => setApellidos(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:border-erpBlue outline-none"
                placeholder="Ej. Mendoza Ríos"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Correo Corporativo</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:border-erpBlue outline-none"
                placeholder="cmendoza@erp.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña Inicial</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:border-erpBlue outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Rol de Acceso (RBAC)</label>
              <select
                value={idRol}
                onChange={e => setIdRol(Number(e.target.value))}
                className="w-full border border-gray-300 p-2 rounded focus:border-erpBlue outline-none"
              >
                {roles.map((r: any) => (
                  <option key={r.idRol} value={r.idRol}>
                    {r.nombreRol} - {r.descripcion}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-erpBlue hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Shield size={18} /> Guardar Usuario y Asignar Rol
            </button>
          </form>
        </div>

        {/* Tabla de Usuarios y Roles */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Lock className="text-erpBlue" size={22} />
                Control de Acceso Basado en Roles (RBAC)
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Gestión de cuentas de usuario, permisos por módulo y seguridad con encriptación BCrypt.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-xs uppercase text-gray-700 border-b">
                  <th className="p-3">Código</th>
                  <th className="p-3">Operador</th>
                  <th className="p-3">Correo</th>
                  <th className="p-3">Rol Asignado</th>
                  <th className="p-3">Hash BCrypt</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u: any) => (
                  <tr key={u.idUsuario} className="border-b hover:bg-gray-50 text-sm">
                    <td className="p-3 font-mono font-semibold text-gray-700">{u.codigoEmpleado}</td>
                    <td className="p-3 font-medium text-gray-800">{u.nombres} {u.apellidos}</td>
                    <td className="p-3 text-gray-600">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        u.nombreRol === 'ADMIN'
                          ? 'bg-indigo-100 text-indigo-800'
                          : u.nombreRol === 'VENDEDOR'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {u.nombreRol}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs text-gray-400 truncate max-w-[110px]" title={u.passwordHash}>
                      {u.passwordHash}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        u.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.estado}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleEstado(u.idUsuario)}
                        className="p-1.5 rounded hover:bg-gray-200 text-gray-600 transition"
                        title="Activar / Bloquear cuenta"
                      >
                        <Power size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
