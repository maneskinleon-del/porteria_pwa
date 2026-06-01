# Control de Acceso Portería 🚪📱

Un sistema web moderno, ultrarrápido y seguro diseñado específicamente para personal de portería y conserjería. Permite registrar ingresos y salidas en tiempo real de visitas, residentes, contratistas y proveedores con persistencia offline en `localStorage`.

El diseño está optimizado para dispositivos móviles y tablets (PWA) de modo que los guardias puedan operar fácilmente en el terreno.

---

## ✨ Características Principales

1. **📥 Registrar Manual**:
   - Formulario cómodo con formateador automático de RUT chileno (`XX.XXX.XXX-X`) y Patente vehicular (`ABCD-12` o `AB-1234`).
   - Detección inteligente de personas frecuentes: sugiere el nombre, tipo de ingreso y vehículo asociado en cuanto se tipea el RUT.
   - Prevención de duplicación de identidades y control de movimientos redundantes (no permite registrar dos ingresos consecutivos para la misma persona sin una salida previa).

2. **⚡ Acceso 1-Toque (Nuevo)**:
   - Panel de botones grandes para teléfonos táctiles. Registrar el ingreso o la salida de residentes y repartidores frecuentes ahora toma **un único toque**.
   - Lista dinámica filtrable por categoría o nombre.

3. **📊 Exportación Inteligente con UTF-8 BOM**:
   - Generación de reportes al instante en formato CSV compatible directamente con Microsoft Excel.
   - **Garantía de Codificación**: Agrega un prefijo BOM de UTF-8 (`\uFEFF`) y exporta con delimitadores de punto y coma (`;`), asegurando que todos los acentos y la "ñ" se visualicen perfectamente al abrir el archivo en cualquier versión de Excel sin desconfigurarse.

4. **⚙️ Importación & Administración JSON**:
   - Carga bases de datos de personas recurrentes o históricos de bitácoras directamente con archivos JSON estructurados.
   - Validaciones robustas de tipos, RUTs y patentes previenen la inyección de datos corruptos o incompletos.

---

## 📱 Guía de Instalación en Teléfono (PWA)

Esta aplicación cumple con los estándares de **Progressive Web App (PWA)**, lo que significa que no requiere descargas pesadas de Google Play o App Store.

### Para Android (Google Chrome):
1. Abra el navegador y navegue a la URL de la aplicación.
2. Presione los **tres puntos de opciones** en la esquina superior derecha.
3. Toque la opción **"Agregar a la pantalla de inicio"** o **"Instalar aplicación"**.
4. ¡Listo! Tendrá un icono directo en el menú de su celular que se abre a pantalla completa.

### Para iOS / iPhone (Safari):
1. Inicie la aplicación en Safari.
2. Toque el botón de **"Compartir"** (el icono de cuadro con flecha hacia arriba).
3. Deslice hacia abajo y seleccione **"Añadir a pantalla de inicio"**.
4. Confirme el nombre y presione **"Añadir"**.

---

## ⚙️ Configuración y Desarrollo

### Requisitos:
* **Node.js** (v18 o superior)
* **npm**

### Comandos útiles:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (con HMR inactivo por control de preview)
npm run dev

# Compilar para producción (genera recursos compactos en /dist)
npm run build

# Limpiar compilaciones anteriores cruzando compatibilidad (Windows & Unix)
npm run clean

# Analizar la consistencia de tipos estrictos con TypeScript
npm run lint
```

## 🛠️ Estructura del Proyecto

* `src/types.ts`: Definición de tipos y esquemas estrictos (e.g., `RegistroMovimiento`, `AuthorizedPerson`).
* `src/utils.ts`: Centralización de validadores de RUT, patente chilena, pre-procesamiento del CSV e importadores JSON endurecidos.
* `src/App.tsx`: Interfaz de usuario interactiva y optimizada con lógica de estados altamente fluida.
