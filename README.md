# AUDITADVAS
### Sistema Institucional de Gestión de Calidad Médica, Auditoría de Expedientes y Control de Lotes de Entrega

**AUDITADVAS** es una plataforma web para la recepción, auditoría clínica, control de glosas, seguimiento por lotes/ciclos de corte y generación de relaciones de entrega oficiales de **Expedientes Médicos Hospitalarios** y **Emergencias**.

---

## 📋 Características Principales

1. **Estructura Oficial de Planilla:**
   - Casillas estándar: `#` | `F.CIERRE` | `NOMBRE PACIENTE` | `NAP` | `NOTA` | `COBERTURA` | `MONTO GLOSADO` (rojo) | `A PAGAR` (azul, autocalculado: Cobertura - Glosa).
   - Encabezado institucional: `GESTIÓN DE CALIDAD MÉDICA &bull; (809) 588-1717 EXT. 1177/1178`.
   - Selector y filtro dinámico de Aseguradoras de Riesgos de Salud (ARS): *ARS SeNaSa, Primera ARS, Mapfre, Humano, Monumental, Renacer*, etc.
   - Casilla oficial enmarcada de `FECHA ENTREGA`.

2. **Cadena de Seguimiento y HUD Principal:**
   - **Expedientes Médicos:** Recepción &rarr; Relación a Auditores &rarr; Relación de Biopsias &rarr; Entrega a ARS &rarr; Entrega a Facturación.
   - **Emergencias:** Recepción de Emergencias &rarr; Relación a ARS &rarr; Entrega a Facturación.
   - Indicadores en tiempo real de cantidad de casos y balances financieros por etapa.

3. **Gestión de Lotes y Ciclos de Entrega:**
   - Asignación obligatoria de cada expediente a un lote de recepción diario (ej. corte de 26 casos).
   - Vista general de todos los lotes con filtros por fecha de corte, estado y búsqueda profunda de pacientes.
   - Transferencia y asignación masiva de expedientes entre lotes.

4. **Línea de Tiempo de Observaciones (Cadena de Notas):**
   - Registro cronológico de notas con autor, rol, etapa e incidencias clínicas (falta de firma, biopsia pendiente, objeción de catálogo, etc.).

5. **Sistema Multiusuario con Control de Acceso (RBAC):**
   - **Administrador General:** Control total, eliminación y gestión de usuarios.
   - **Auditor Médico / Calidad:** Revisión técnica, aplicación de glosas (`MONTO GLOSADO`) y derivación a Biopsias.
   - **Recepción y Admisión:** Registro de nuevos casos, ingreso de NAP y apertura de lotes.
   - **Facturación y Entrega:** Generación de actas y relación de entrega a aseguradoras.

6. **Relaciones Oficiales Imprimibles y Exportación:**
   - Generación de acta idéntica a la hoja de cálculo física con bloques de firma formal (`ENTREGADO POR` y `RECIBIDO POR`).
   - Exportación directa a formato CSV/Excel.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React 19, TypeScript
- **Estilos:** Tailwind CSS v4
- **Iconografía:** Lucide React
- **Herramienta de Construcción:** Vite 6 / 8

---

## 🚀 Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TU_USUARIO/AUDITADVAS.git
   cd AUDITADVAS
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 📄 Licencia

Uso institucional hospitalario &bull; Gestión de Calidad Médica y Auditoría.
