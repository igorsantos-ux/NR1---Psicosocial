import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Settings, Users, LogOut, ShieldCheck, Building2, FileText, Factory } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active }: any) => (
  <Link
    to={path}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active 
        ? 'bg-clinicfy-pink text-white shadow-lg shadow-clinicfy-pink/20' 
        : 'text-gray-500 hover:bg-gray-100'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium text-sm">{label}</span>
  </Link>
);

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-clinicfy-light">
      {/* Sidebar - Oculta em mobile se necessário, mas aqui faremos fixa para desktop */}
      <aside className="w-64 bg-white border-r border-gray-100 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-clinicfy-teal p-2 rounded-xl text-white">
            <ShieldCheck size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">PGR <span className="text-clinicfy-teal">Smart</span></span>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/admin" active={location.pathname === '/admin'} />
          <SidebarItem icon={Building2} label="Cadastrar Empresa" path="/admin/companies" active={location.pathname === '/admin/companies'} />
          <SidebarItem icon={Factory} label="Empresas" path="/admin/empresas" active={location.pathname.startsWith('/admin/empresas')} />
          <SidebarItem icon={ClipboardList} label="Planos de Ação" path="/admin/plans" active={location.pathname === '/admin/plans'} />
          <SidebarItem icon={Users} label="GHEs e Equipes" path="/admin/ghes" active={location.pathname === '/admin/ghes'} />
          <SidebarItem icon={FileText} label="Relatório PGR" path="/admin/pgr" active={location.pathname === '/admin/pgr'} />
          <SidebarItem icon={Settings} label="Configurações" path="/admin/settings" active={location.pathname === '/admin/settings'} />
        </nav>

        <div className="pt-6 border-t border-gray-100">
          <SidebarItem icon={LogOut} label="Sair" path="/logout" active={false} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="text-lg font-bold text-gray-700">Painel de Revisão Técnica</h2>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-clinicfy-dark">Eng. Denis Antônio</p>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Segurança do Trabalho</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-clinicfy-teal/10 flex items-center justify-center text-clinicfy-teal font-bold">
              DA
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
