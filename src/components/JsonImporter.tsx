import React, { useRef, useState } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useUIStore } from '../store/useUIStore';

export default function JsonImporter() {
  const { importAuthorizedPeople } = useDataStore();
  const { triggerToast } = useUIStore();
  const [dragActive, setDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle'|'success'|'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const processFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const json = JSON.parse(text);
        if (!Array.isArray(json)) throw new Error('El archivo debe contener un arreglo JSON.');
        
        const parsedData: any[] = [];
        for (const item of json) {
          const rut = item.rut || item.documento || item.id || '';
          const nombreBase = item.nombre || '';
          const apellido = item.apellido || '';
          const nombreFinal = apellido ? `${nombreBase} ${apellido}`.trim() : nombreBase;
          const tipoIngreso = item.tipo || item.tipoIngreso || 'Desconocido';
          
          if (!rut) throw new Error('Estructura inválida. Todos los registros deben tener al menos RUT o documento.');
          
          parsedData.push({
            rut: String(rut),
            nombre: nombreFinal ? String(nombreFinal) : 'Sin Nombre',
            tipoIngreso: String(tipoIngreso),
            patente: item.patente ? String(item.patente) : '',
            departamento: item.departamento ? String(item.departamento) : ''
          });
        }

        await importAuthorizedPeople(parsedData);
        const importedCount = parsedData.length;
        setImportStatus('success');
        triggerToast(`✅ ${importedCount} registros importados correctamente a IndexedDB.`);
      } catch (err: any) {
        setImportStatus('error');
        setErrorMessage(err.message || 'Error desconocido al parsear JSON');
        triggerToast(`❌ Error de importación: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 flex items-center gap-3">
        <UploadCloud className="w-6 h-6 text-blue-400" />
        <div>
          <h3 className="text-lg font-bold">Importador de Autorizados</h3>
          <p className="text-xs text-slate-300">Carga masiva de residentes o frecuentes mediante archivo JSON.</p>
        </div>
      </div>
      
      <div className="p-6">
        <div 
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
            dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleChange}
          />
          <UploadCloud className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
          <p className="text-base font-bold text-slate-700 dark:text-slate-300">Arrastra tu archivo JSON aquí</p>
          <p className="text-sm text-slate-500 mt-1">O haz clic para seleccionar (solo .json)</p>
        </div>

        {importStatus === 'success' && (
          <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Importación Exitosa</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500">La lista de autorizados se ha cargado en la base de datos local y acelerará los próximos ingresos.</p>
            </div>
          </div>
        )}

        {importStatus === 'error' && (
          <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-rose-800 dark:text-rose-400">Error de Importación</p>
              <p className="text-xs text-rose-600 dark:text-rose-500">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
