import { useMemo, useState } from 'react';
import { FileSpreadsheet, RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useUIStore } from '../store/useUIStore';
import { exportToCSV, SAMPLE_REGISTROS } from '../utils';
import { TipoAccion, TipoIngreso } from '../types';

export default function ExportPanel() {
  const { registros, clearLogs, restoreDemoData } = useDataStore();
  const { filterAccion, filterTipo, searchQuery, setFilters, triggerToast } = useUIStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const stats = useMemo(() => {
    let ingresos = 0;
    let salidas = 0;
    
    const latestActionByPerson: { [rut: string]: TipoAccion } = {};
    const sortedChronological = [...registros].reverse();
    
    sortedChronological.forEach(reg => {
      latestActionByPerson[reg.rut.toUpperCase()] = reg.accion;
    });

    registros.forEach(reg => {
      if (reg.accion === 'INGRESO') ingresos++;
      if (reg.accion === 'SALIDA') salidas++;
    });

    const personasEnRecinto = Object.values(latestActionByPerson).filter(
      accion => accion === 'INGRESO'
    ).length;

    const totalProveedores = registros.filter(r => r.tipoIngreso === 'Proveedor').length;
    const totalResidentes = registros.filter(r => r.tipoIngreso === 'Residente').length;
    const totalContratistas = registros.filter(r => r.tipoIngreso === 'Contratista').length;

    return { totalIngresos: ingresos, totalSalidas: salidas, personasEnRecinto, totalProveedores, totalResidentes, totalContratistas };
  }, [registros]);

  const filteredRegistros = useMemo(() => {
    return registros.filter(reg => {
      const matchSearch = reg.rut.toLowerCase().includes(searchQuery.toLowerCase()) || reg.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || reg.patente.toLowerCase().includes(searchQuery.toLowerCase());
      const matchAccion = filterAccion === 'TODOS' || reg.accion === filterAccion;
      const matchTipo = filterTipo === 'TODOS' || reg.tipoIngreso === filterTipo;
      return matchSearch && matchAccion && matchTipo;
    });
  }, [registros, searchQuery, filterAccion, filterTipo]);

  const handleExport = () => {
    if (filteredRegistros.length === 0) {
      triggerToast('❌ No hay registros que coincidan con los filtros para descargar.');
      return;
    }
    const csvContent = exportToCSV(filteredRegistros);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bitacora_porteria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('📊 Reporte exportado correctamente (UTF-8 BOM).');
  };

  const handleWipeData = async () => {
    await clearLogs();
    setShowClearConfirm(false);
    triggerToast('🗑️ Base de datos IndexedDB limpiada correctamente.');
  };

  const handleRestoreDemo = async () => {
    await restoreDemoData();
    triggerToast('⚡ Datos de demostración restaurados en IndexedDB.');
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Historial Total logs</span>
          <span className="text-4xl font-extrabold text-blue-700 dark:text-blue-500 block mt-2">{registros.length}</span>
          <p className="text-[11px] text-slate-500 mt-2">Bitácora completa en IndexedDB</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Flujo Residentes</span>
          <span className="text-4xl font-extrabold text-slate-700 dark:text-slate-300 block mt-2">{stats.totalResidentes}</span>
          <p className="text-[11px] text-slate-500 mt-2">Vecinos y planta fija</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Control Proveedores</span>
          <span className="text-4xl font-extrabold text-amber-600 dark:text-amber-500 block mt-2">{stats.totalProveedores}</span>
          <p className="text-[11px] text-slate-500 mt-2">Empresas y despachos</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Contratistas</span>
          <span className="text-4xl font-extrabold text-orange-600 dark:text-orange-500 block mt-2">{stats.totalContratistas}</span>
          <p className="text-[11px] text-slate-500 mt-2">Mantenimiento externo</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Panel de Exportación
            </h3>
            <p className="text-xs text-slate-300">Generador de planillas para Excel.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button onClick={handleExport} className="w-full sm:w-auto min-h-11 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition">
              <FileSpreadsheet className="w-4 h-4" /> Exportar CSV
            </button>
            <button onClick={handleRestoreDemo} className="w-full sm:w-auto min-h-11 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition">
              <RefreshCw className="w-4 h-4 text-blue-400" /> Demo
            </button>
          </div>
        </div>

        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="w-full min-w-0 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Filtros:</span>
              <div className="w-full sm:w-auto overflow-x-auto">
              <div className="inline-flex min-w-max rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-xs">
                {['TODOS', 'INGRESO', 'SALIDA'].map(a => (
                  <button key={a} onClick={() => setFilters({ filterAccion: a as any })} className={`min-h-9 px-3 py-1 font-semibold rounded-md ${filterAccion === a ? 'bg-slate-800 text-white' : 'text-slate-600 dark:text-slate-300'}`}>{a}</button>
                ))}
              </div>
              </div>
              <div className="w-full sm:w-auto overflow-x-auto">
              <div className="inline-flex min-w-max rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-xs">
                {['TODOS', 'Visita', 'Proveedor', 'Residente', 'Contratista'].map(t => (
                  <button key={t} onClick={() => setFilters({ filterTipo: t as any })} className={`min-h-9 px-2.5 py-1 font-semibold rounded-md ${filterTipo === t ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>{t}</button>
                ))}
              </div>
              </div>
            </div>
            <button onClick={() => { setFilters({ filterAccion: 'TODOS', filterTipo: 'TODOS', searchQuery: '' }); triggerToast('🧙 Filtros restablecidos.'); }} className="w-full md:w-auto min-h-10 text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Restablecer
            </button>
          </div>
        </div>

        <div className="p-4 md:p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Vista previa:</h4>
            <span className="text-xs font-mono font-bold text-slate-400">{filteredRegistros.length} filas</span>
          </div>
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto w-full bg-white dark:bg-slate-800 max-h-96 overflow-y-auto">
            <table className="min-w-[720px] md:min-w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 px-2 md:py-2.5 md:px-4">Fecha / Hora</th><th className="py-2 px-2 md:py-2.5 md:px-4">RUT</th><th className="py-2 px-2 md:py-2.5 md:px-4">Nombre</th><th className="py-2 px-2 md:py-2.5 md:px-4">Clasificación</th><th className="hidden md:table-cell py-2.5 px-4">Patente</th><th className="py-2 px-2 md:py-2.5 md:px-4">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium text-slate-700 dark:text-slate-300">
                {filteredRegistros.slice(0, 100).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="py-2 px-2 md:px-4">{row.timestamp}</td><td className="py-2 px-2 md:px-4 font-bold">{row.rut}</td><td className="py-2 px-2 md:px-4">{row.nombre}</td>
                    <td className="py-2 px-2 md:px-4"><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">{row.tipoIngreso}</span></td>
                    <td className="hidden md:table-cell py-2 px-4">{row.patente}</td><td className="py-2 px-2 md:px-4">{row.accion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-rose-50 dark:bg-rose-950/30 rounded-2xl p-4 md:p-5 border border-rose-200 dark:border-rose-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 rounded-xl"><Trash2 className="w-6 h-6 stroke-[2]" /></div>
          <div>
            <h4 className="font-bold text-rose-900 dark:text-rose-400 text-base">Mantenimiento (Zona Crítica)</h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 max-w-xl">Borrado permanente de IndexedDB. Recomendado al iniciar un nuevo mes.</p>
          </div>
        </div>
        {!showClearConfirm ? (
          <button onClick={() => setShowClearConfirm(true)} className="w-full md:w-auto min-h-11 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-sm font-bold rounded-xl transition">Vaciar Todo</button>
        ) : (
          <div className="grid grid-cols-2 md:flex gap-2 shrink-0 w-full md:w-auto">
            <button onClick={handleWipeData} className="min-h-11 bg-rose-700 hover:bg-rose-800 text-white px-3.5 py-2 text-xs font-bold rounded-lg">Confirmar</button>
            <button onClick={() => setShowClearConfirm(false)} className="min-h-11 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 px-3.5 py-2 text-xs font-bold rounded-lg">Mantener</button>
          </div>
        )}
      </div>
    </div>
  );
}
