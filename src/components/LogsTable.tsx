import { useMemo } from 'react';
import { 
  Search, 
  Clipboard, 
  Edit2, 
  Trash2, 
  ArrowUpRight, 
  Check, 
  X,
  FileText
} from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { useDataStore } from '../store/useDataStore';
import { RegistroMovimiento, TipoIngreso } from '../types';
import VirtualTable from './VirtualTable';

export default function LogsTable() {
  const {
    searchQuery,
    editingId,
    editNombre,
    editPatente,
    editEditTipoIngreso,
    setFilters,
    setEditing,
    setEditFields,
    triggerToast
  } = useUIStore();

  const {
    registros,
    authorizedPeople,
    updateRegistro,
    deleteRegistro,
    addRegistro
  } = useDataStore();

  // --- FILTERED COMPUTATION ---
  const filteredRegistros = useMemo(() => {
    return registros.filter(reg => {
      const matchSearch = 
        reg.rut.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.patente.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchSearch;
    });
  }, [registros, searchQuery]);

  // --- HELPERS ---
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`📋 Copiado: ${text}`);
  };

  const handleQuickCheckout = async (prev: RegistroMovimiento) => {
    await addRegistro({
      tipoIngreso: prev.tipoIngreso,
      rut: prev.rut,
      nombre: prev.nombre,
      patente: prev.patente,
      accion: 'SALIDA'
    });
    triggerToast(`📤 Salida rápida registrada: ${prev.nombre}`);
  };

  const handleSaveEdit = async (id: string) => {
    const finalNombre = editNombre.trim();
    if (!finalNombre) {
      triggerToast('⚠️ El nombre no puede estar vacío.');
      return;
    }
    
    await updateRegistro(id, {
      nombre: finalNombre,
      patente: editPatente.trim() || 'Peatón',
      tipoIngreso: editEditTipoIngreso
    });

    setEditing(null);
    triggerToast('📝 Registro editado correctamente.');
  };

  // --- THEAD HEADER ---
  const tableHeader = (
    <thead>
      <tr className="bg-slate-100/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
        <th className="py-2 px-2 md:py-3 md:px-4 w-24 md:w-28">Fecha • Hora</th>
        <th className="hidden md:table-cell py-3 px-4 w-32">Clasificación</th>
        <th className="py-2 px-2 md:py-3 md:px-4">Identificación</th>
        <th className="hidden md:table-cell py-3 px-4 w-28">Vehículo</th>
        <th className="py-2 px-2 md:py-3 md:px-4 w-24 md:w-28 text-center">Movimiento</th>
        <th className="py-2 px-2 md:py-3 md:px-4 w-28 md:w-36 text-right">Acción</th>
      </tr>
    </thead>
  );

  // --- EMPTY STATE ---
  const tableEmpty = (
    <div className="text-center text-slate-400 dark:text-slate-500 py-12 px-4">
      <Search className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
      <p className="font-bold text-slate-650 dark:text-slate-350">No hay movimientos encontrados</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
        Escriba otro término o realice un registro manual en el formulario de la izquierda.
      </p>
    </div>
  );

  // --- ROW RENDERER ---
  const renderRow = (reg: RegistroMovimiento, index: number) => {
    const isIngreso = reg.accion === 'INGRESO';
    const isEditingThis = editingId === reg.id;

    // Check if this person is currently inside based on their latest action in logs
    const isCurrentlyInside = (() => {
      const personLogs = registros.filter(r => r.rut.toUpperCase() === reg.rut.toUpperCase());
      return personLogs.length > 0 && personLogs[0].accion === 'INGRESO' && personLogs[0].id === reg.id;
    })();

    // Check if authorized
    const isPersonAuthorized = authorizedPeople.some(
      p => p.rut.replace(/[^0-9kK]/g, '').toUpperCase() === reg.rut.replace(/[^0-9kK]/g, '').toUpperCase()
    );

    let badgeTipoColor = '';
    switch (reg.tipoIngreso) {
      case 'Residente':
        badgeTipoColor = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
        break;
      case 'Proveedor':
        badgeTipoColor = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-350 border border-blue-100 dark:border-blue-900/40';
        break;
      case 'Contratista':
        badgeTipoColor = 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-350 border border-orange-100 dark:border-orange-900/40';
        break;
      default:
        badgeTipoColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-350 border border-emerald-100 dark:border-emerald-900/40';
    }

    return (
      <tr key={reg.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850/40 transition group text-slate-700 dark:text-slate-350">
        
        {/* Timestamp */}
        <td className="py-2 px-2 md:py-3 md:px-4 font-mono text-[11px] text-slate-500 dark:text-slate-450 leading-tight">
          {reg.timestamp.split(' ').map((term, i) => (
            <span key={i} className="block whitespace-nowrap">{term}</span>
          ))}
        </td>

        {/* Classification */}
        <td className="hidden md:table-cell py-3 px-4">
          {isEditingThis ? (
            <select 
              value={editEditTipoIngreso} 
              onChange={(e) => setEditFields({ editEditTipoIngreso: e.target.value as TipoIngreso })}
              className="w-full h-9 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 rounded-lg font-bold text-slate-800 dark:text-slate-100"
            >
              <option value="Visita">Visita</option>
              <option value="Proveedor">Proveedor</option>
              <option value="Residente">Residente</option>
              <option value="Contratista">Contratista</option>
            </select>
          ) : (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeTipoColor}`}>
              {reg.tipoIngreso}
            </span>
          )}
        </td>

        {/* Identity & Name */}
        <td className="py-2 px-2 md:py-3 md:px-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-slate-200">{reg.rut}</span>
            <span className={`md:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeTipoColor}`}>
              {reg.tipoIngreso}
            </span>
            {isPersonAuthorized && (
              <span className="text-[9px] bg-blue-500/10 dark:bg-blue-450/10 text-blue-700 dark:text-blue-400 font-bold px-1 rounded-sm border border-blue-450/20">
                Autorizado
              </span>
            )}
            <button 
              onClick={() => copyToClipboard(reg.rut)}
              className="text-slate-400 hover:text-blue-500 p-1.5 -m-1 transition cursor-pointer"
              title="Copiar RUT"
              aria-label={`Copiar RUT ${reg.rut}`}
            >
              <Clipboard className="w-3.5 h-3.5" />
            </button>
          </div>

          {isEditingThis ? (
            <input 
              type="text" 
              value={editNombre} 
              onChange={(e) => setEditFields({ editNombre: e.target.value })}
              className="text-base md:text-xs bg-white dark:bg-slate-800 border border-slate-350 dark:border-slate-700 px-2 h-10 w-full max-w-xs rounded-lg font-semibold mt-1 text-slate-800 dark:text-slate-100"
            />
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-450 font-semibold truncate max-w-xs">{reg.nombre}</div>
          )}
          <div className="md:hidden mt-1">
            <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded leading-normal ${
              reg.patente === 'Peatón'
                ? 'text-slate-400 dark:text-slate-600 italic bg-slate-50 dark:bg-slate-900/30'
                : 'bg-yellow-50 dark:bg-yellow-950/20 text-slate-850 dark:text-yellow-400 border border-yellow-250 dark:border-yellow-900/40'
            }`}>
              {reg.patente}
            </span>
          </div>
        </td>

        {/* Plate */}
        <td className="hidden md:table-cell py-3 px-4">
          {isEditingThis ? (
            <input 
              type="text" 
              value={editPatente} 
              onChange={(e) => setEditFields({ editPatente: e.target.value })}
              className="text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-2 h-9 w-24 rounded-lg mt-1 uppercase text-slate-800 dark:text-slate-100"
            />
          ) : (
            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded leading-normal ${
              reg.patente === 'Peatón'
                ? 'text-slate-400 dark:text-slate-600 italic bg-slate-50 dark:bg-slate-900/30'
                : 'bg-yellow-50 dark:bg-yellow-950/20 text-slate-850 dark:text-yellow-400 border border-yellow-250 dark:border-yellow-900/40'
            }`}>
              {reg.patente}
            </span>
          )}
        </td>

        {/* Movement */}
        <td className="py-2 px-2 md:py-3 md:px-4 text-center">
          <span className={`inline-flex items-center text-[10px] font-black tracking-wider px-2 py-1 rounded-lg ${
            isIngreso 
              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400' 
              : 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400'
          }`}>
            {isIngreso ? '📥 INGRESO' : '📤 SALIDA'}
          </span>
        </td>

        {/* Control actions */}
        <td className="py-2 px-2 md:py-3 md:px-4 text-right">
          <div className="flex items-center justify-end gap-1.5">
            
            {isIngreso && isCurrentlyInside && (
              <button
                onClick={() => handleQuickCheckout(reg)}
                className="bg-orange-600 dark:bg-orange-700 hover:bg-orange-700 dark:hover:bg-orange-650 cursor-pointer text-white font-bold text-[10px] px-2.5 min-h-9 rounded-lg flex items-center gap-1 shadow-sm transition active:scale-95 shrink-0"
                title="Registrar salida automática de esta persona con la hora actual"
                aria-label="Registrar salida rápida"
              >
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                Salida Rápida
              </button>
            )}

            {isEditingThis ? (
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => handleSaveEdit(reg.id)}
                  className="min-h-9 min-w-9 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer inline-flex items-center justify-center"
                  title="Guardar cambios"
                  aria-label="Confirmar edición"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setEditing(null)}
                  className="min-h-9 min-w-9 px-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer inline-flex items-center justify-center"
                  title="Cancelar cambios"
                  aria-label="Cancelar edición"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 opacity-100 sm:opacity-40 group-hover:opacity-100 transition duration-150">
                <button 
                  onClick={() => setEditing(reg.id, reg.nombre, reg.patente, reg.tipoIngreso)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 min-h-9 min-w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer inline-flex items-center justify-center"
                  title="Editar fila"
                  aria-label="Editar registro"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm(`¿Seguro que desea eliminar el registro de ${reg.nombre}?`)) {
                      deleteRegistro(reg.id);
                      triggerToast(`🗑️ Registro de ${reg.nombre} eliminado.`);
                    }
                  }}
                  className="text-rose-450 hover:text-rose-600 min-h-9 min-w-9 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer inline-flex items-center justify-center"
                  title="Eliminar fila"
                  aria-label="Eliminar registro"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>
        </td>

      </tr>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      
      {/* Cabecera / Buscador */}
      <div className="bg-slate-50 dark:bg-slate-950 px-4 md:px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-850 dark:text-slate-150 text-sm flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-slate-500" />
            Registros en Bitácora Activa ({filteredRegistros.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Últimos movimientos cargados desde IndexedDB</p>
        </div>

        <div className="relative w-full sm:w-auto">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
            placeholder="Buscar por RUT, nombre o patente..."
            className="text-base sm:text-xs pl-8 pr-16 sm:pr-12 h-11 sm:h-10 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 w-full sm:w-64 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          {searchQuery && (
            <button 
              onClick={() => setFilters({ searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-700 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Renderizado de Tabla Virtualizada */}
      <VirtualTable 
        items={filteredRegistros}
        itemHeight={64}
        viewportHeight={480}
        header={tableHeader}
        emptyMessage={tableEmpty}
        renderRow={renderRow}
      />

    </div>
  );
}
