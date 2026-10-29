import { useEffect, useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LogOut, ShoppingCart, ShoppingBag, LayoutDashboard, Package,
  Users, Menu, Server, Shield, FileSpreadsheet
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<{ nombreCompleto: string; email: string; rol: string }>({
    nombreCompleto: 'Lorena Damián',
    email: 'admin@erp.com',
    rol: 'ADMIN'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined') {
      navigate('/login');
      return;
    }
    const storedUser = localStorage.getItem('erp_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('erp_user');
    navigate('/login');
  };

  const canSeeVentas = user.rol === 'ADMIN' || user.rol === 'VENDEDOR';
  const canSeeCompras = user.rol === 'ADMIN' || user.rol === 'COMPRADOR';
  const isAdmin = user.rol === 'ADMIN';

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-erpGray">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-erpBlue text-white flex flex-col shadow-xl transition-all duration-300 ease-in-out flex-shrink-0`}>
        {/* Logo Area */}
        <div className={`h-16 font-bold border-b border-blue-800 flex items-center ${isSidebarOpen ? 'px-6 text-xl gap-3' : 'justify-center text-xl'}`}>
          <Server className="flex-shrink-0 text-blue-300" size={28} /> 
          {isSidebarOpen && <span className="truncate tracking-wide">ERP Comercial</span>}
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 py-4 flex flex-col gap-1.5 overflow-x-hidden overflow-y-auto px-3 custom-scrollbar">
          <Link
            to="/"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              isActive('/') ? 'bg-blue-700 font-bold shadow-inner' : 'hover:bg-blue-800'
            } ${!isSidebarOpen && 'justify-center'}`}
            title="Dashboard Principal"
          >
            <LayoutDashboard size={20} className="flex-shrink-0" /> 
            {isSidebarOpen && <span className="truncate font-medium">Dashboard</span>}
          </Link>
          
          {canSeeVentas && (
            <Link
              to="/pedidos/nuevo"
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive('/pedidos/nuevo') ? 'bg-blue-700 font-bold shadow-inner' : 'hover:bg-blue-800'
              } ${!isSidebarOpen && 'justify-center'}`}
              title="Módulo de Ventas"
            >
              <ShoppingCart size={20} className="flex-shrink-0" /> 
              {isSidebarOpen && <span className="truncate font-medium">Ventas</span>}
            </Link>
          )}
          
          {canSeeCompras && (
            <Link
              to="/compras/nueva"
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive('/compras/nueva') ? 'bg-blue-700 font-bold shadow-inner' : 'hover:bg-blue-800'
              } ${!isSidebarOpen && 'justify-center'}`}
              title="Módulo de Compras"
            >
              <ShoppingBag size={20} className="flex-shrink-0" /> 
              {isSidebarOpen && <span className="truncate font-medium">Compras</span>}
            </Link>
          )}

          {/* Divider Catálogos */}
          {isSidebarOpen ? (
            <div className="pt-5 pb-1 px-3 text-xs uppercase font-extrabold text-blue-300 tracking-wider">Catálogos Maestros</div>
          ) : (
            <div className="pt-4 pb-2 mx-auto border-b border-blue-800 w-8"></div>
          )}

          <Link
            to="/maestros/socios"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              isActive('/maestros/socios') ? 'bg-blue-700 font-bold shadow-inner' : 'hover:bg-blue-800'
            } ${!isSidebarOpen && 'justify-center'}`}
            title="Clientes y Proveedores"
          >
            <Users size={20} className="flex-shrink-0" /> 
            {isSidebarOpen && <span className="truncate font-medium">Clientes y Proveedores</span>}
          </Link>
          
          <Link
            to="/maestros/productos"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              isActive('/maestros/productos') ? 'bg-blue-700 font-bold shadow-inner' : 'hover:bg-blue-800'
            } ${!isSidebarOpen && 'justify-center'}`}
            title="Inventario y Productos"
          >
            <Package size={20} className="flex-shrink-0" /> 
            {isSidebarOpen && <span className="truncate font-medium">Productos y Stock</span>}
          </Link>

          <Link
            to="/reportes"
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              isActive('/reportes') ? 'bg-blue-700 font-bold shadow-inner' : 'hover:bg-blue-800'
            } ${!isSidebarOpen && 'justify-center'}`}
            title="Reportes Ejecutivos"
          >
            <FileSpreadsheet size={20} className="flex-shrink-0" /> 
            {isSidebarOpen && <span className="truncate font-medium">Reportes</span>}
          </Link>

          {/* Divider Administración */}
          {isAdmin && (
            <>
              {isSidebarOpen ? (
                <div className="pt-5 pb-1 px-3 text-xs uppercase font-extrabold text-blue-300 tracking-wider">Administración</div>
              ) : (
                <div className="pt-4 pb-2 mx-auto border-b border-blue-800 w-8"></div>
              )}

              <Link
                to="/seguridad/usuarios"
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive('/seguridad/usuarios') ? 'bg-blue-700 font-bold shadow-inner' : 'hover:bg-blue-800'
                } ${!isSidebarOpen && 'justify-center'}`}
                title="Gestión de Usuarios y Roles"
              >
                <Shield size={20} className="flex-shrink-0" /> 
                {isSidebarOpen && <span className="truncate font-medium">Usuarios y Roles</span>}
              </Link>
            </>
          )}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-blue-800 bg-blue-900 bg-opacity-30">
          <div className={`flex items-center gap-3 mb-3 text-sm ${!isSidebarOpen && 'justify-center'}`}>
            <div className="bg-blue-700 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-sm">
              {user.nombreCompleto.slice(0, 2).toUpperCase()}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <div className="truncate font-semibold text-white">{user.nombreCompleto}</div>
                <div className="truncate text-xs text-blue-200">{user.rol} · {user.email}</div>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-2 w-full text-left text-sm p-2.5 rounded-lg text-red-200 hover:bg-red-600 hover:text-white transition-colors ${!isSidebarOpen && 'justify-center'}`}
            title="Cerrar Sesión"
          >
            <LogOut size={18} className="flex-shrink-0" /> 
            {isSidebarOpen && <span className="font-semibold">Cerrar Sesión</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Top Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 border-b border-gray-200 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors focus:outline-none"
              title={isSidebarOpen ? 'Colapsar Menú' : 'Expandir Menú'}
            >
              <Menu size={24} />
            </button>
            <div className="w-px h-6 bg-gray-300"></div>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight">
              Sistema ERP Empresarial — Gestión Comercial e Inventario
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-erpBlue border border-blue-200">
              Perfil: {user.rol}
            </span>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
