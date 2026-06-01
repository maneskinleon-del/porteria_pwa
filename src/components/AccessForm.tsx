import { useEffect, useMemo } from 'react';
import { 
  User, 
  Car, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles 
} from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { useDataStore } from '../store/useDataStore';
import { TipoIngreso, TipoAccion, AuthorizedPerson } from '../types';
import { formatChileanRUT, validateChileanRUT, formatPatente } from '../utils';

export default function AccessForm() {
  const {
    rut,
    nombre,
    patente,
    tipoIngreso,
    saveAsFrequent,
    isPasaporte,
    autoFilledStatus,
    setForm,
    resetForm,
    triggerToast
  } = useUIStore();

  const {
    registros,
    authorizedPeople,
    addRegistro,
    addAuthorizedPerson
  } = useDataStore();

  // --- RUT VALIDATION ---
  const isRutValid = useMemo(() => {
    if (isPasaporte) return true;
    if (!rut) return false;
    return validateChileanRUT(rut);
  }, [rut, isPasaporte]);

  // --- AUTOFILL ON RUNNING IDENTIFICATION LOOKUP ---
  useEffect(() => {
    const cleanInput = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (cleanInput.length >= 3) {
      // Find matches in authorized list first
      const matchAuth = authorizedPeople.find(
        p => p.rut.replace(/[^0-9kK]/g, '').toUpperCase() === cleanInput
      );
      
      // Find matches in recent logs second
      const matchLog = !matchAuth
        ? registros.find(r => r.rut.replace(/[^0-9kK]/g, '').toUpperCase() === cleanInput)
        : null;

      if (matchAuth) {
        setForm({
          nombre: matchAuth.nombre,
          tipoIngreso: matchAuth.tipoIngreso,
          patente: matchAuth.patente || 'Peatón',
          autoFilledStatus: `✨ Persona autorizada: ${matchAuth.tipoIngreso}`
        });
      } else if (matchLog) {
        setForm({
          nombre: matchLog.nombre,
          tipoIngreso: matchLog.tipoIngreso,
          patente: matchLog.patente || 'Peatón',
          autoFilledStatus: `✨ Persona registrada previamente: ${matchLog.tipoIngreso}`
        });
      }
    } else {
      setForm({ autoFilledStatus: null });
    }
  }, [rut, authorizedPeople, registros, setForm]);

  // --- CHANGE HANDLERS ---
  const handleRutChange = (val: string) => {
    if (isPasaporte) {
      setForm({ rut: val.toUpperCase() });
    } else {
      setForm({ rut: formatChileanRUT(val) });
    }
  };

  const handlePatenteChange = (val: string) => {
    setForm({ patente: formatPatente(val) });
  };

  // --- QUICK-FILL TEMPLATES ---
  const handleTemplateFill = (tipo: TipoIngreso) => {
    setForm({ tipoIngreso: tipo });
    
    switch (tipo) {
      case 'Proveedor':
        setForm({
          rut: '11.222.333-4',
          nombre: 'Logística Express (Repartos)',
          patente: 'DF-GR-88'
        });
        break;
      case 'Contratista':
        setForm({
          rut: '15.678.901-K',
          nombre: 'Servicio Eléctrico Santiago',
          patente: 'HR-WT-24'
        });
        break;
      case 'Residente':
        setForm({
          rut: '18.456.789-2',
          nombre: 'Felipe Sandoval Torres',
          patente: 'GC-YY-33'
        });
        break;
      default:
        setForm({
          rut: '12.345.678-9',
          nombre: 'Camila Paz Troncoso',
          patente: 'Peatón'
        });
        break;
    }
    triggerToast(`📝 Creada plantilla de pruebas para: ${tipo}`);
  };

  // --- SUBMIT TRANSACTION LOG ---
  const handleSubmit = async (accion: TipoAccion) => {
    const cleanRut = rut.trim();
    const cleanNombre = nombre.trim();
    const cleanPatente = patente.trim() || 'Peatón';

    if (!cleanRut) {
      triggerToast('⚠️ El RUT o número de Pasaporte es obligatorio.');
      return;
    }
    if (!cleanNombre) {
      triggerToast('⚠️ Ingrese un Nombre Completo para el registro.');
      return;
    }
    if (!isPasaporte && cleanRut.length > 0 && !isRutValid) {
      triggerToast('⚠️ RUT Inválido. Verifique el formato chileno.');
      return;
    }

    // --- DUPLICATE IDENTITY/NAME CORRECTION CHECK ---
    const cleanInRut = cleanRut.replace(/[^0-9kK]/g, '').toUpperCase();
    const existingInLogs = registros.find(r => r.rut.replace(/[^0-9kK]/g, '').toUpperCase() === cleanInRut);
    const existingInAuth = authorizedPeople.find(p => p.rut.replace(/[^0-9kK]/g, '').toUpperCase() === cleanInRut);
    const existingRegisteredName = existingInLogs?.nombre || existingInAuth?.nombre;

    let finalNombre = cleanNombre;
    if (existingRegisteredName && existingRegisteredName.toLowerCase() !== cleanNombre.toLowerCase()) {
      triggerToast(`⚠️ Nombre corregido a: "${existingRegisteredName}" por coincidencia de RUT.`);
      finalNombre = existingRegisteredName;
    }

    // --- CONSECUTIVE ACTION LOGICAL VALIDATION ---
    if (existingInLogs) {
      if (accion === 'INGRESO' && existingInLogs.accion === 'INGRESO') {
        triggerToast(`⚠️ Error: ${existingInLogs.nombre} ya se encuentra DENTRO. Registre una SALIDA primero.`);
        return;
      }
      if (accion === 'SALIDA' && existingInLogs.accion === 'SALIDA') {
        triggerToast(`⚠️ Error: ${existingInLogs.nombre} ya se encuentra FUERA. Registre un INGRESO primero.`);
        return;
      }
    }

    // Write transaction to DB
    await addRegistro({
      tipoIngreso,
      rut: cleanRut,
      nombre: finalNombre,
      patente: cleanPatente,
      accion
    });

    let frequentMsg = '';
    // Save to Authorized list if requested and doesn't exist
    if (saveAsFrequent) {
      const exists = authorizedPeople.some(
        p => p.rut.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanInRut
      );
      if (!exists) {
        const newPerson: AuthorizedPerson = {
          rut: isPasaporte ? cleanRut : (formatChileanRUT(cleanRut) || cleanRut),
          nombre: finalNombre,
          tipoIngreso,
          patente: cleanPatente
        };
        await addAuthorizedPerson(newPerson);
        frequentMsg = ' y guardado en Habituales';
      }
    }

    resetForm();
    triggerToast(`✅ ${accion} registrado con éxito para ${finalNombre}${frequentMsg}.`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div className="bg-slate-900 dark:bg-slate-950 px-5 py-4 text-white flex items-center justify-between">
        <h2 className="font-bold tracking-tight text-white text-base">Registrar Acceso</h2>
        <span className="bg-blue-500/10 text-blue-400 text-[10px] font-mono px-2 py-0.5 rounded-md border border-blue-500/25">
          PORTERO ACCESO
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Plantillas rápidas */}
        <div>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block mb-2 uppercase tracking-wider">
            Completar Rápido:
          </span>
          <div className="flex flex-wrap gap-2">
            {(['Visita', 'Proveedor', 'Residente', 'Contratista'] as TipoIngreso[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => handleTemplateFill(t)}
                className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl transition duration-150 active:scale-95 cursor-pointer"
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

        {/* Formulario */}
        <div className="space-y-4">
          
          {/* RUT / Pasaporte */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="input-rut" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                RUT / Cédula Identidad
              </label>
              
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-500 dark:text-slate-400 select-none">
                <input 
                  type="checkbox" 
                  checked={isPasaporte} 
                  onChange={(e) => {
                    setForm({ isPasaporte: e.target.checked, rut: '' });
                  }} 
                  className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-50 dark:bg-slate-800 w-4 h-4 cursor-pointer" 
                />
                Pasaporte / Extranjero
              </label>
            </div>

            <div className="relative">
              <input 
                type="text" 
                id="input-rut"
                value={rut}
                onChange={(e) => handleRutChange(e.target.value)}
                placeholder={isPasaporte ? "PASAPORTE-9921" : "Ej: 12.345.678-9"} 
                className={`w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-850 font-mono text-base font-bold border rounded-xl transition-all duration-150 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:outline-hidden ${
                  isPasaporte 
                    ? 'border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200 focus:border-indigo-500' 
                    : rut.length === 0 
                      ? 'border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100' 
                      : isRutValid 
                        ? 'border-emerald-500 dark:border-emerald-700 bg-emerald-50/20 text-emerald-950 dark:text-emerald-100 focus:border-emerald-600' 
                        : 'border-amber-400 dark:border-amber-700 bg-amber-50/20 text-amber-950 dark:text-amber-100 focus:border-amber-500'
                }`}
                required 
              />
              
              {!isPasaporte && rut.length > 0 && (
                <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1">
                  {isRutValid ? (
                    <div className="flex items-center text-emerald-600 dark:text-emerald-400 gap-1 text-xs font-bold font-sans">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> RUT Ok
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-600 dark:text-amber-400 gap-1 text-xs font-bold font-sans">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> Incompleto
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Alerta de Autofill */}
            {autoFilledStatus && (
              <div className="mt-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-blue-200 dark:border-blue-900/60 transition-all duration-300">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
                <span>{autoFilledStatus}</span>
              </div>
            )}
          </div>

          {/* Nombre completo */}
          <div>
            <label htmlFor="input-nombre" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Nombre Completo
            </label>
            <div className="relative">
              <input 
                type="text" 
                id="input-nombre"
                value={nombre}
                onChange={(e) => setForm({ nombre: e.target.value })}
                placeholder="Ej: Juan de Dios Pérez" 
                className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-300 dark:border-slate-700 rounded-xl text-base font-semibold text-slate-850 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:outline-hidden transition-all duration-150"
                required 
              />
              <div className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Patente Vehicular */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="input-patente" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Patente Vehículo <span className="text-slate-400 dark:text-slate-500 text-[10px] font-normal tracking-normal lowercase">(Opcional)</span>
              </label>
              
              <button 
                type="button"
                onClick={() => setForm({ patente: 'Peatón' })}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                🚶 Es Peatón
              </button>
            </div>

            <div className="relative">
              <input 
                type="text" 
                id="input-patente"
                value={patente}
                onChange={(e) => handlePatenteChange(e.target.value)}
                placeholder="ABCD-12 o Peatón" 
                className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-850 font-mono text-base font-bold border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder:font-normal placeholder:font-sans focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:outline-hidden transition-all duration-150 uppercase"
              />
              <div className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400">
                <Car className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Clasificación */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Clasificación de Ingreso
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(['Visita', 'Proveedor', 'Residente', 'Contratista'] as TipoIngreso[]).map((opt) => {
                const isSelected = tipoIngreso === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm({ tipoIngreso: opt })}
                    className={`py-3 px-4 border rounded-xl text-xs font-bold text-center transition duration-150 cursor-pointer active:scale-98 ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 dark:border-blue-700 text-white shadow-md shadow-blue-500/20' 
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt === 'Visita' && '👤 '}
                    {opt === 'Proveedor' && '📦 '}
                    {opt === 'Residente' && '🏡 '}
                    {opt === 'Contratista' && '🔧 '}
                    {opt === 'Contratista' ? 'Técnico' : opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guardar Frecuente */}
          <div className="flex items-center gap-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 p-3.5 rounded-xl mt-3">
            <input 
              type="checkbox" 
              id="checkbox-save-frequent"
              checked={saveAsFrequent}
              onChange={(e) => setForm({ saveAsFrequent: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-slate-300 dark:border-slate-700 rounded-md focus:ring-blue-500 cursor-pointer accent-blue-600 bg-white dark:bg-slate-800"
            />
            <label htmlFor="checkbox-save-frequent" className="text-xs font-bold text-slate-800 dark:text-slate-300 cursor-pointer select-none">
              Guardar en listado de Personas Habituales
            </label>
          </div>

        </div>

        {/* Acciones principales (Botones gigantes) */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button 
            type="button" 
            onClick={() => handleSubmit('INGRESO')}
            className="bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 cursor-pointer text-white font-black py-4 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition active:scale-95 text-base border-b-4 border-emerald-800"
            aria-label="Registrar Ingreso de persona"
          >
            <ArrowDownLeft className="w-5 h-5 bg-emerald-500 p-0.5 rounded-full stroke-[3]" />
            📥 INGRESO
          </button>
          
          <button 
            type="button" 
            onClick={() => handleSubmit('SALIDA')}
            className="bg-rose-600 dark:bg-rose-700 hover:bg-rose-700 dark:hover:bg-rose-600 cursor-pointer text-white font-black py-4 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-500/10 transition active:scale-95 text-base border-b-4 border-rose-800"
            aria-label="Registrar Salida de persona"
          >
            <ArrowUpRight className="w-5 h-5 bg-rose-500 p-0.5 rounded-full stroke-[3]" />
            📤 SALIDA
          </button>
        </div>

      </div>
    </div>
  );
}
