import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Moon, 
  Sun,
  LayoutDashboard,
  Users,
  Database,
  BarChart,
  X
} from 'lucide-react';
import { useDataStore } from './store/useDataStore';
import { useUIStore } from './store/useUIStore';

import SystemClock from './components/SystemClock';
import AccessForm from './components/AccessForm';
import LogsTable from './components/LogsTable';
import QuickAccess from './components/QuickAccess';
import ExportPanel from './components/ExportPanel';
import JsonImporter from './components/JsonImporter';

function Toast() {
  const { toastMessage, clearToast } = useUIStore();
  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
      <span className="font-medium text-sm">{toastMessage}</span>
      <button onClick={clearToast} className="text-slate-400 hover:text-white transition">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function App() {
  const { isLoading, fetchInitialData } = useDataStore();
  const { activeTab, setActiveTab } = useUIStore();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Inicializando base de datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30 transition-colors duration-200">
      <Toast />

      <nav className="bg-slate-900 dark:bg-black text-white sticky top-0 z-40 shadow-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                  Control de Acceso
                </h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Sistema de Portería PWA</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <SystemClock />
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95"
                title="Alternar tema oscuro"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto pb-4 mb-6 hide-scrollbar gap-2">
          {([
            { id: 'registro', label: 'Control', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'frecuentes', label: 'Bitácora', icon: <Database className="w-4 h-4" /> },
            { id: 'exportar', label: 'Dashboard', icon: <BarChart className="w-4 h-4" /> },
            { id: 'importar', label: 'Ajustes BD', icon: <Users className="w-4 h-4" /> },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-300">
          {activeTab === 'registro' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4">
                <AccessForm />
              </div>
              <div className="lg:col-span-8">
                <QuickAccess />
              </div>
            </div>
          )}

          {activeTab === 'frecuentes' && (
            <LogsTable />
          )}

          {activeTab === 'exportar' && (
            <ExportPanel />
          )}

          {activeTab === 'importar' && (
            <div className="max-w-3xl">
              <JsonImporter />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
