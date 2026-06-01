import { useMemo } from 'react';
import { Search, Users, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { useDataStore } from '../store/useDataStore';
import { AuthorizedPerson, TipoIngreso, TipoAccion } from '../types';

export default function QuickAccess() {
  const {
    frecuentesSearchQuery,
    frecuentesClassFilter,
    setFilters,
    triggerToast
  } = useUIStore();

  const {
    registros,
    authorizedPeople,
    addRegistro
  } = useDataStore();

  // --- COMPUTE THE LAST ACTION FOR EVERY PERSON ---
  const lastActionByRut = useMemo(() => {
    const map: Record<string, TipoAccion> = {};
    // Reverse array to scan chronologically (earliest to latest), letting newer entries overwrite older ones
    const chronological = [...registros].reverse();
    chronological.forEach(reg => {
      map[reg.rut.replace(/[^0-9kK]/g, '').toUpperCase()] = reg.accion;
    });
    return map;
  }, [registros]);

  // --- FILTER FREQUENT PEOPLE ---
  const filteredFrecuentes = useMemo(() => {
    return authorizedPeople.filter(person => {
      const matchSearch = 
        person.nombre.toLowerCase().includes(frecuentesSearchQuery.toLowerCase()) ||
        person.rut.toLowerCase().includes(frecuentesSearchQuery.toLowerCase()) ||
        (person.patente && person.patente.toLowerCase().includes(frecuentesSearchQuery.toLowerCase()));

      const matchClass = frecuentesClassFilter === 'TODOS' || person.tipoIngreso === frecuentesClassFilter;

      return matchSearch && matchClass;
    });
  }, [authorizedPeople, frecuentesSearchQuery, frecuentesClassFilter]);

  // --- LOG A 1-TAP ACTION ---
  const handleQuickLog = async (person: AuthorizedPerson, accion: TipoAccion) => {
    const cleanInRut = person.rut.replace(/[^0-9kK]/g, '').toUpperCase();
    const existingInLogs = registros.find(r => r.rut.replace(/[^0-9kK]/g, '').toUpperCase() === cleanInRut);
    
    // Validate consecutive moves
    if (existingInLogs) {
      if (accion === 'INGRESO' && existingInLogs.accion === 'INGRESO') {
        triggerToast(`⚠️ Error: ${person.nombre} ya se encuentra DENTRO. Debe registrar SALIDA.`);
        return;
      }
      if (accion === 'SALIDA' && existingInLogs.accion === 'SALIDA') {
        triggerToast(`⚠️ Error: ${person.nombre} ya se encuentra AFUERA. Debe registrar INGRESO.`);
        return;
      }
    }

    await addRegistro({
      tipoIngreso: person.tipoIngreso,
      rut: person.rut.trim(),
      nombre: person.nombre.trim(),
      patente: person.patente?.trim() || 'Peatón',
      accion
    });

    triggerToast(`⚡ [1-Toque] ${accion === 'INGRESO' ? '📥 INGRESO' : '📤 SALIDA'} para ${person.nombre}.`);
  };

  return (
    <div className="space-y-6">
      {/* Caja de Intro */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 p-5 text-white rounded-2xl shadow-lg border border-emerald-800/60 dark:border-emerald-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
              OPTIMIZADO MÓVIL 📱
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">Acceso 1-Toque (Residentes y Proveedores Habituales)</h2>
          <p className="text-xs text-emerald-100/90 leading-relaxed font-medium max-w-2xl">
            Registra ingresos y salidas al instante con un solo toque, sin escribir nombres o RUTs. Diseñado específicamente para pantallas táctiles.
          </p>
        </div>
        <div className="shrink-0 bg-slate-950/85 border border-emerald-500/30 px-5 py-3 rounded-2xl text-right shadow-inner">
          <span className="text-[10px] text-emerald-400 block uppercase font-extrabold tracking-wider leading-none mb-1">Habituales Cargados</span>
          <span className="text-xl font-black text-white" aria-live="polite">{authorizedPeople.length} personas</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4 transition-colors">
        <div className="relative w-full lg:w-80">
          <input 
            type="text" 
            value={frecuentesSearchQuery}
            onChange={(e) => setFilters({ frecuentesSearchQuery: e.target.value })}
            placeholder="Buscar habitual por nombre, RUT, patente..."
            className="w-full text-sm pl-9 pr-8 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-hidden bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          {frecuentesSearchQuery && (
            <button 
              onClick={() => setFilters({ frecuentesSearchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 bg-transparent cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categorías */}
        <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
          <button
            onClick={() => setFilters({ frecuentesClassFilter: 'TODOS' })}
            className={`px-3 py-2 text-xs font-bold rounded-xl cursor-pointer transition active:scale-95 ${
              frecuentesClassFilter === 'TODOS'
                ? 'bg-slate-800 dark:bg-slate-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todos
          </button>
          {(['Visita', 'Proveedor', 'Residente', 'Contratista'] as TipoIngreso[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilters({ frecuentesClassFilter: t })}
              className={`px-3 py-2 text-xs font-bold rounded-xl cursor-pointer transition active:scale-95 ${
                frecuentesClassFilter === t
                  ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-md shadow-blue-500/10'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t === 'Visita' && '👤 '}
              {t === 'Proveedor' && '📦 '}
              {t === 'Residente' && '🏡 '}
              {t === 'Contratista' && '🔧 '}
              {t === 'Contratista' ? 'Técnico' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFrecuentes.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 p-12 text-center border border-slate-200 dark:border-slate-800 rounded-2xl transition-colors">
            <Users className="w-10 h-10 text-slate-350 dark:text-slate-700 mx-auto mb-3" />
            <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">No se encontraron personas habituales</p>
            <p className="text-xs text-slate-400 dark:text-slate-550 mt-1">
              Cargue una base de datos más amplia en la sección "4. Importar Persona JSON" para habilitar el registro rápido.
            </p>
          </div>
        ) : (
          filteredFrecuentes.map((person, i) => {
            const normalizedRut = person.rut.replace(/[^0-9kK]/g, '').toUpperCase();
            const lastAction = lastActionByRut[normalizedRut];
            const isInside = lastAction === 'INGRESO';

            let classColor = '';
            switch (person.tipoIngreso) {
              case 'Residente':
                classColor = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
                break;
              case 'Proveedor':
                classColor = 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-350 border border-blue-100 dark:border-blue-900/40';
                break;
              case 'Contratista':
                classColor = 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-350 border border-orange-100 dark:border-orange-900/40';
                break;
              default:
                classColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-350 border border-emerald-100 dark:border-emerald-900/40';
            }

            return (
              <div 
                key={person.rut + i}
                className={`bg-white dark:bg-slate-900 border text-left p-4 rounded-2xl flex flex-col justify-between h-48 transition-all duration-200 shadow-xs hover:shadow-md ${
                  isInside 
                    ? 'border-emerald-400 dark:border-emerald-800 ring-2 ring-emerald-500/10 dark:ring-emerald-500/5' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${classColor}`}>
                      {person.tipoIngreso}
                    </span>

                    <div className="flex items-center gap-1.5" aria-label={`Estado actual: ${isInside ? 'Dentro' : 'Fuera'}`}>
                      <span className={`w-2 h-2 rounded-full ${isInside ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`} />
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 dark:text-slate-450 select-none">
                        {isInside ? 'Dentro' : 'Fuera'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1 leading-snug">{person.nombre}</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-mono text-[11px] font-extrabold text-slate-550 dark:text-slate-400 leading-none">{person.rut}</span>
                      {person.patente && person.patente !== 'Peatón' && (
                        <span className="font-mono text-[10px] bg-yellow-50 dark:bg-yellow-950/20 text-slate-800 dark:text-yellow-450 border border-yellow-200 dark:border-yellow-900/40 px-1.5 py-0.5 rounded font-bold leading-none">
                          🚗 {person.patente}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones gigantes táctiles */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  <button
                    onClick={() => handleQuickLog(person, 'INGRESO')}
                    className="py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer select-none shadow-xs active:scale-95 transition-all border-b-2 border-emerald-800"
                    aria-label={`Registrar ingreso para ${person.nombre}`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    INGRESÓ
                  </button>

                  <button
                    onClick={() => handleQuickLog(person, 'SALIDA')}
                    className="py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer select-none shadow-xs active:scale-95 transition-all border-b-2 border-rose-800"
                    aria-label={`Registrar salida para ${person.nombre}`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    SALIÓ
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
