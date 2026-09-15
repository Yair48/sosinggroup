/* ══════════════════════════════════════════════════════════════
   ECOCHECK · Motor de cotización

   Mapea las obligaciones detectadas en el diagnóstico a los
   servicios de SOSING que las resuelven, y arma una propuesta
   con los precios reales del catálogo.

   Los valores son "desde": el alcance definitivo se confirma
   con el cliente. El sistema nunca promete un precio cerrado.
   ══════════════════════════════════════════════════════════════ */

export type Servicio = {
  id: string;
  nombre: string;
  descripcion: string;
  desde: number;
  plazo: string;
  incluye: string[];
  resuelve: string[];        // ids de obligaciones que atiende
};

/* ── Catálogo real de SOSING ──────────────────────────────── */
export const SERVICIOS: Servicio[] = [
  {
    id: "form-pgirs",
    nombre: "Plan de Gestión Integral de Residuos Sólidos",
    descripcion:
      "Formulación completa del PGIRS de su establecimiento: caracterización, " +
      "programas, metas de aprovechamiento y cronograma de seguimiento.",
    desde: 800_000,
    plazo: "7 días hábiles",
    incluye: [
      "Visita de caracterización",
      "Documento firmado por ingeniero con matrícula",
      "Formatos de registro diligenciables",
      "Acompañamiento en la radicación",
    ],
    resuelve: ["pgirs"],
  },
  {
    id: "form-respel",
    nombre: "Plan de Gestión Integral de RESPEL",
    descripcion:
      "Plan de manejo de residuos peligrosos con categorización de generador, " +
      "rutas internas, almacenamiento, contingencias y formatos de control.",
    desde: 700_000,
    plazo: "7 a 10 días hábiles",
    incluye: [
      "Caracterización de corrientes de residuo",
      "Bitácora de registro mensual",
      "Plan de contingencias",
      "Documento firmado por ingeniero",
    ],
    resuelve: ["respel-manejo", "respel-bitacora", "respel-indeterminado"],
  },
  {
    id: "tramite-registro",
    nombre: "Inscripción y trámites ante la autoridad ambiental",
    descripcion:
      "Preparamos, radicamos y hacemos seguimiento a sus inscripciones y " +
      "registros ante la autoridad competente.",
    desde: 350_000,
    plazo: "5 días hábiles más el término de la autoridad",
    incluye: [
      "Preparación del expediente",
      "Radicación en plataforma o ventanilla",
      "Seguimiento hasta obtener respuesta",
      "Entrega del radicado y del acto",
    ],
    resuelve: ["respel-registro", "acu-inscripcion"],
  },
  {
    id: "form-psmv",
    nombre: "Plan de Saneamiento Básico",
    descripcion:
      "Formulación del plan para su establecimiento: diagnóstico sanitario, " +
      "programas de manejo, cronograma e indicadores. Incluye visita técnica.",
    desde: 600_000,
    plazo: "8 a 12 días hábiles",
    incluye: [
      "Visita técnica al establecimiento",
      "Diagnóstico sanitario",
      "Programas y cronograma",
      "Documento firmado",
    ],
    resuelve: ["vert-pretratamiento", "vert-identificar"],
  },
  {
    id: "vert-permiso",
    nombre: "Trámite de permiso de vertimiento",
    descripcion:
      "Caracterización, documentación técnica y radicación del permiso de " +
      "vertimiento ante la autoridad ambiental.",
    desde: 1_500_000,
    plazo: "Según términos de la autoridad",
    incluye: [
      "Caracterización con laboratorio acreditado",
      "Plan de gestión del riesgo del vertimiento",
      "Radicación y seguimiento",
      "Atención de requerimientos",
    ],
    resuelve: ["vert-verificar"],
  },
  {
    id: "acu-completo",
    nombre: "Gestión completa de Aceite de Cocina Usado",
    descripcion:
      "Inscripción ante la autoridad, formatos de control, capacitación del " +
      "personal y estructura del reporte anual.",
    desde: 450_000,
    plazo: "5 días hábiles",
    incluye: [
      "Inscripción como generador",
      "Formatos de registro y entrega",
      "Capacitación del personal, con evidencias",
      "Estructura del reporte anual",
    ],
    resuelve: ["acu-capacitacion", "acu-reporte", "acu-gestor", "acu-almacenamiento"],
  },
  {
    id: "suscripcion",
    nombre: "SOSING Ambiental 24/7",
    descripcion:
      "Acompañamiento continuo: alertas antes de cada vencimiento, control de " +
      "certificados y soporte de un ingeniero cuando lo necesite.",
    desde: 79_900,
    plazo: "Activación inmediata",
    incluye: [
      "Alertas antes de cada vencimiento",
      "Control de certificados y radicados",
      "Soporte prioritario por WhatsApp",
      "Informes de cumplimiento",
    ],
    resuelve: [],        // complementa, no reemplaza
  },
];

/* ── Resultado de la cotización ───────────────────────────── */
export type LineaCotizacion = {
  servicio: Servicio;
  motivo: string;        // por qué se incluye
};

export type Cotizacion = {
  lineas: LineaCotizacion[];
  desde: number;
  plazoEstimado: string;
  incluyeSuscripcion: boolean;
  mensaje: string;
};

/* ── Motor ────────────────────────────────────────────────── */
export function cotizar(
  idsObligaciones: string[],
  nivelRiesgo: string
): Cotizacion | null {

  if (idsObligaciones.length === 0) return null;

  const lineas: LineaCotizacion[] = [];
  const usados = new Set<string>();

  for (const s of SERVICIOS) {
    if (s.id === "suscripcion") continue;

    const atiende = s.resuelve.filter((r) =>
      idsObligaciones.some((o) => o === r || o.startsWith(r))
    );

    if (atiende.length > 0 && !usados.has(s.id)) {
      usados.add(s.id);
      lineas.push({
        servicio: s,
        motivo:
          atiende.length === 1
            ? "Resuelve una de las obligaciones identificadas"
            : `Resuelve ${atiende.length} de las obligaciones identificadas`,
      });
    }
  }

  if (lineas.length === 0) return null;

  const desde = lineas.reduce((s, l) => s + l.servicio.desde, 0);

  /* Plazo estimado: el mayor de los servicios incluidos */
  const plazos = lineas.map((l) => l.servicio.plazo);
  const plazoEstimado =
    plazos.length === 1
      ? plazos[0]
      : "Entre 10 y 20 días hábiles, según el alcance definitivo";

  const mensaje =
    nivelRiesgo === "ALTO"
      ? "Su establecimiento tiene obligaciones vencidas o sin atender. " +
        "Conviene resolverlas antes de una visita de la autoridad."
      : nivelRiesgo === "MEDIO"
      ? "Su establecimiento tiene obligaciones que conviene documentar y radicar."
      : "Su panorama es favorable. Estos servicios le ayudan a mantener los soportes al día.";

  return {
    lineas,
    desde,
    plazoEstimado,
    incluyeSuscripcion: nivelRiesgo !== "BAJO",
    mensaje,
  };
}

export const SUSCRIPCION = SERVICIOS.find((s) => s.id === "suscripcion")!;

export const pesos = (n: number) =>
  "$" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

/* ── Mensaje de WhatsApp con la cotización ────────────────── */
export function mensajeCotizacion(
  c: Cotizacion,
  datos: { tipoNegocio?: string; departamento?: string; nivelRiesgo?: string }
): string {
  const servicios = c.lineas
    .map((l) => `• ${l.servicio.nombre} — desde ${pesos(l.servicio.desde)}`)
    .join("\n");

  return (
    `*Solicitud de cotización — ECOCHECK*\n\n` +
    `Hice el diagnóstico en su página y me interesa:\n\n` +
    `${servicios}\n\n` +
    `*Mi situación:*\n` +
    `Actividad: ${datos.tipoNegocio || "—"}\n` +
    `Departamento: ${datos.departamento || "—"}\n` +
    `Nivel de riesgo: ${datos.nivelRiesgo || "—"}\n\n` +
    `Quisiera conocer el alcance y el valor definitivo.`
  );
}


/* ══════════════════════════════════════════════════════════════
   ENVÍO DE LA SOLICITUD DE COTIZACIÓN

   No depende de que el usuario presione enviar en WhatsApp.
   El envío ocurre al presionar el botón.
   ══════════════════════════════════════════════════════════════ */

const WEB3FORMS =
  process.env.NEXT_PUBLIC_WEB3FORMS_KEY || "REEMPLAZAR_CON_LA_CLAVE";

export type DatosSolicitante = {
  nombre?: string;
  empresa?: string;
  email?: string;
  telefono?: string;
  tipoNegocio?: string;
  departamento?: string;
  autoridad?: string;
  nivelRiesgo?: string;
  obligaciones?: string[];
};

export async function enviarSolicitudCotizacion(
  c: Cotizacion,
  d: DatosSolicitante
): Promise<boolean> {
  const servicios = c.lineas
    .map((l) => `${l.servicio.nombre} (desde ${pesos(l.servicio.desde)})`)
    .join(" | ");

  try {
    const r = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS,
        subject: `COTIZACIÓN · ${d.nombre || "Sin nombre"} · ${pesos(c.desde)}`,
        from_name: "ECOCHECK — Solicitud de cotización",
        "— SOLICITUD —": "Cotización de servicios",
        Nombre: d.nombre || "No suministrado",
        Empresa: d.empresa || "—",
        Correo: d.email || "No suministrado",
        Celular: d.telefono || "No suministrado",
        "— DIAGNÓSTICO —": "",
        Actividad: d.tipoNegocio || "—",
        Departamento: d.departamento || "—",
        Autoridad: d.autoridad || "—",
        Riesgo: d.nivelRiesgo || "—",
        Obligaciones: (d.obligaciones || []).join(" | ") || "—",
        "— COTIZACIÓN —": "",
        Servicios: servicios,
        Valor_desde: pesos(c.desde),
        Plazo: c.plazoEstimado,
      }),
    });
    const j = await r.json().catch(() => null);
    return Boolean(r.ok && j?.success);
  } catch {
    return false;
  }
}
