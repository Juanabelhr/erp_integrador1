import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardHome from './pages/DashboardHome';
import CrearPedido from './pages/CrearPedido';
import Productos from './pages/Productos';
import SociosNegocio from './pages/SociosNegocio';
import CrearCompra from './pages/CrearCompra';
import MonitoreoSap from './pages/MonitoreoSap';
import UsuariosRoles from './pages/UsuariosRoles';
import Reportes from './pages/Reportes';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Dashboard />}>
        <Route index element={<DashboardHome />} />
        <Route path="pedidos/nuevo" element={<CrearPedido />} />
        <Route path="compras/nueva" element={<CrearCompra />} />
        <Route path="maestros/productos" element={<Productos />} />
        <Route path="maestros/socios" element={<SociosNegocio />} />
        <Route path="integracion/monitoreo" element={<MonitoreoSap />} />
        <Route path="seguridad/usuarios" element={<UsuariosRoles />} />
        <Route path="reportes" element={<Reportes />} />
      </Route>
    </Routes>
  );
}

export default App;
