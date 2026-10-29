import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Mail, Server, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@erp.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('/api/v1/auth/login', { email, password });
      const token = response.data.token || response.data.Token;
      localStorage.setItem('token', token);
      localStorage.setItem('erp_user', JSON.stringify({
        idUsuario: response.data.idUsuario ?? 1,
        email: response.data.usuario ?? email,
        nombreCompleto: response.data.nombreCompleto ?? email,
        rol: response.data.rol ?? 'ADMIN'
      }));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Credenciales incorrectas o usuario inactivo');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarDemo = (correo: string) => {
    setEmail(correo);
    setPassword('123456');
    setError('');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Columna Izquierda */}
      <div className="hidden md:flex md:w-1/2 relative bg-erpBlue overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80" 
          alt="Equipo corporativo" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900 to-transparent opacity-80"></div>
        <div className="relative z-10 flex flex-col justify-end p-16 w-full">
          <div className="flex items-center gap-3 text-white mb-6">
            <Server size={40} />
            <h2 className="text-4xl font-extrabold tracking-tight">Enterprise ERP</h2>
          </div>
          <p className="text-blue-100 text-lg leading-relaxed max-w-lg">
            Sistema empresarial unificado para la automatización y gestión integral de compras, ventas, inventario y clientes.
          </p>
        </div>
      </div>

      {/* Columna Derecha - Formulario de Acceso */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white shadow-[-20px_0_30px_-15px_rgba(0,0,0,0.1)] z-20 relative">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Bienvenido de nuevo</h1>
            <p className="text-gray-500 mt-2">Ingresa tus credenciales para acceder al portal ERP</p>
          </div>

          {error && <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-sm">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-erpBlue focus:border-transparent transition" 
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-erpBlue focus:border-transparent transition" 
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center text-sm text-gray-600">
                <input type="checkbox" className="mr-2 rounded text-erpBlue focus:ring-erpBlue" defaultChecked />
                Recordar sesión JWT
              </label>
              <span className="text-xs text-erpBlue font-semibold">Seguridad RBAC + BCrypt</span>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-erpBlue text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-800 transition duration-300 shadow-md hover:shadow-lg flex justify-center items-center gap-2"
            >
              {loading ? 'Validando credenciales...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Selector rápido de perfiles para demostración */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
              <ShieldCheck size={14} className="text-erpBlue" />
              Acceso Rápido por Rol (Demo Sustentación):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => seleccionarDemo('admin@erp.com')}
                className={`text-xs py-1.5 px-2 rounded border font-semibold transition ${
                  email === 'admin@erp.com' ? 'bg-blue-50 border-erpBlue text-erpBlue' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Admin (Todo)
              </button>
              <button
                type="button"
                onClick={() => seleccionarDemo('ventas@erp.com')}
                className={`text-xs py-1.5 px-2 rounded border font-semibold transition ${
                  email === 'ventas@erp.com' ? 'bg-blue-50 border-erpBlue text-erpBlue' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Vendedor
              </button>
              <button
                type="button"
                onClick={() => seleccionarDemo('compras@erp.com')}
                className={`text-xs py-1.5 px-2 rounded border font-semibold transition ${
                  email === 'compras@erp.com' ? 'bg-blue-50 border-erpBlue text-erpBlue' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Comprador
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-400">
            &copy; 2026 ERP Integrador I - UTP. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </div>
  );
}
