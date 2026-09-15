"use client";

import { useState } from "react";
import CapturaProspecto from "./CapturaProspecto";
import { evento, eventoPersonalizado } from "./MetaPixel";
import ResultadoAccionable from "./ResultadoAccionable";
import BitacoraRespel from "./BitacoraRespel";
import type { RegistroMensual } from "@/lib/ecocheck-motor-respel";

/* =========================================================
   SOSING ECOCHECK — Sección para sosinggroup.com
   Uso: importar en app/page.tsx y colocar donde se desee
        import EcocheckSection from "@/components/EcocheckSection";
        <EcocheckSection />
   ========================================================= */

const CARS: Record<string, string> = {
  "Amazonas": "CORPOAMAZONIA", "Antioquia": "CORANTIOQUIA / CORNARE / CORPOURABÁ",
  "Arauca": "CORPORINOQUIA", "Atlántico": "CRA", "Bogotá D.C.": "Secretaría Distrital de Ambiente",
  "Bolívar": "CARDIQUE / CSB", "Boyacá": "CORPOBOYACÁ / CORPOCHIVOR", "Caldas": "CORPOCALDAS",
  "Caquetá": "CORPOAMAZONIA", "Casanare": "CORPORINOQUIA", "Cauca": "CRC", "Cesar": "CORPOCESAR",
  "Córdoba": "CVS", "Cundinamarca": "CAR Cundinamarca / CORPOGUAVIO", "Chocó": "CODECHOCÓ",
  "Guainía": "CDA", "Guaviare": "CDA", "Huila": "CAM", "La Guajira": "CORPOGUAJIRA",
  "Magdalena": "CORPAMAG", "Meta": "CORMACARENA", "Nariño": "CORPONARIÑO",
  "Norte de Santander": "CORPONOR", "Putumayo": "CORPOAMAZONIA", "Quindío": "CRQ",
  "Risaralda": "CARDER", "San Andrés y Providencia": "CORALINA", "Santander": "CAS / CDMB",
  "Sucre": "CARSUCRE", "Tolima": "CORTOLIMA", "Valle del Cauca": "CVC / DAGMA",
  "Vaupés": "CDA", "Vichada": "CORPORINOQUIA",
};

const BUSINESS_TYPES = [
  "Restaurante", "Taller automotriz", "Hotel", "Comercio", "Industria",
  "Estación de servicio", "Finca / agro", "Constructora", "IPS / consultorio / laboratorio",
  "Veterinaria", "Estética / tatuajes", "Funeraria", "Otro negocio",
];

type Q = {
  id: string;
  text: string;
  tag: string;
  inverse?: boolean;
  opciones?: { valor: string; texto: string }[];   // pregunta de rango
  soloSi?: { id: string; valor: string };          // condicional
};
const QUESTIONS: Q[] = [
  { id: "q1", text: "¿Generas residuos peligrosos (aceites, químicos, pilas, luminarias)?", tag: "RESPEL" },
  { id: "q1b", text: "En promedio, ¿cuántos kilogramos de residuos peligrosos genera al mes?",
    tag: "Generación declarada", soloSi: { id: "q1", valor: "si" },
    opciones: [
      { valor: "bajo",    texto: "Menos de 10 kg" },
      { valor: "pequeno", texto: "Entre 10 y 100 kg" },
      { valor: "mediano", texto: "Entre 100 y 1.000 kg" },
      { valor: "gran",    texto: "Más de 1.000 kg" },
      { valor: "no_se",   texto: "No sé cuánto genero" },
    ] },
  { id: "q1c", text: "¿Cuántos meses de registros de generación tiene disponibles?",
    tag: "Certeza de la información", soloSi: { id: "q1", valor: "si" },
    opciones: [
      { valor: "1",     texto: "1 mes" },
      { valor: "2_3",   texto: "2 a 3 meses" },
      { valor: "4_5",   texto: "4 a 5 meses" },
      { valor: "6_mas", texto: "6 meses o más" },
      { valor: "sin",   texto: "No tengo registros" },
    ] },
  { id: "q2", text: "¿Usas o generas Aceite de Cocina Usado (ACU)?", tag: "ACU" },
  { id: "q3", text: "¿A dónde van las aguas residuales de tu negocio?",
    tag: "Vertimientos",
    opciones: [
      { valor: "alcantarillado", texto: "Al alcantarillado público" },
      { valor: "fuente",         texto: "A un río, quebrada o al suelo" },
      { valor: "pozo",           texto: "A pozo séptico" },
      { valor: "no_se",          texto: "No sé" },
    ] },
  { id: "q4", text: "¿Captas agua de pozo, aljibe o fuente natural?", tag: "Concesión de aguas" },
  { id: "q5", text: "¿Generas más de 1 m³ de residuos sólidos ordinarios al día?", tag: "PGIRS" },
  { id: "q6", text: "¿Tu negocio realiza obra civil, remodelación o movimiento de tierra?", tag: "RCD" },
  { id: "q7", text: "¿Usas o almacenas sustancias químicas o combustibles?", tag: "RUA" },
  { id: "q8", text: "¿Has recibido alguna vez una visita o requerimiento de la autoridad ambiental?", tag: "Antecedentes" },
  { id: "q9", text: "¿Cuentas con algún documento ambiental vigente (PMA, concepto, permiso)?", tag: "Documentación", inverse: true },
  { id: "q10", text: "¿Sabes con certeza qué trámites ambientales aplican a tu negocio?", tag: "Conocimiento", inverse: true },
  { id: "q11", text: "¿Generas residuos biosanitarios, cortopunzantes o anatomopatológicos?", tag: "PGIRASA — sector salud" },
];

type Item = { id: string; name: string; desc: string; price: number; cat: string; link?: string; desde?: boolean; plazo?: string; cotiza?: boolean };

/* ============================================================
   RECURSOS GRATUITOS — el gancho.
   Se entregan a cambio del correo. Demuestran criterio técnico
   y capturan el contacto.
   ============================================================ */
const RECURSOS = [
  { id: "kit-acu", name: "Kit manejo de Aceite de Cocina Usado", desc: "Guía completa, formatos de registro y checklist. Incluye la obligación de inscripción que casi nadie cumple.", pages: 8, file: "/kits/kit-acu-40eb10495cbc.pdf", para: "Restaurantes y comidas rápidas" },
  { id: "check-rest", name: "Checklist ambiental para restaurantes", desc: "Lista de verificación de 6 frentes con semáforo de riesgo.", pages: 4, file: "/kits/checklist-restaurantes-9a9f3f8f3379.pdf", para: "Establecimientos de comida" },
  { id: "kit-respel", name: "Kit RESPEL", desc: "Categorización de generador, formatos y manejo de residuos peligrosos.", pages: 7, file: "/kits/kit-respel-7018a31d9c3f.pdf", para: "Talleres, clínicas, industria" },
  { id: "kit-pgirs", name: "Kit PGIRS empresarial", desc: "Código de colores vigente, caracterización y tasa de aprovechamiento.", pages: 9, file: "/kits/kit-pgirs-dbcbf9658d62.pdf", para: "Cualquier empresa" },
  { id: "kit-contra", name: "Kit ambiental para contratistas", desc: "Gestión de RCD, bitácora de obra y qué revisa la interventoría.", pages: 13, file: "/kits/kit-contratistas-3ff5717a8efd.pdf", para: "Constructores y obra civil" },
  { id: "matriz", name: "Matriz de requisitos legales", desc: "Normograma ambiental colombiano para identificar qué le aplica.", pages: 5, file: "/kits/matriz-legal-e16c478891ff.pdf", para: "Empresas en licitación" },
];

/* ============================================================
   SERVICIOS PROFESIONALES — con firma de ingeniero.
   Esto es lo que una IA no puede entregar.
   ============================================================ */
const SERVICIOS: Item[] = [
  { id: "revisa-doc", name: "Revisa este documento", desc: "Envíenos el oficio, acta o resolución que recibió. Le explicamos qué le están pidiendo, qué plazo tiene y cómo responder.", price: 49900, cat: "Respuesta a la autoridad", link: "https://checkout.wompi.co/l/wDgbvX" },
  { id: "rev-req", name: "Revisión de requerimiento ambiental", desc: "Análisis del requerimiento y estrategia de respuesta, firmada por ingeniero.", price: 99900, cat: "Respuesta a la autoridad", link: "https://checkout.wompi.co/l/46mleK" },
  { id: "diagnostico", name: "Diagnóstico Ambiental Express", desc: "Informe profesional con sus obligaciones, autoridad competente, nivel de riesgo y plan de acción.", price: 49900, cat: "Diagnósticos con firma", link: "https://checkout.wompi.co/l/65IJJb" },
  { id: "diag-vert", name: "Diagnóstico de vertimientos", desc: "Evaluación técnica de sus vertimientos. Requiere caracterización de laboratorio.", price: 149900, cat: "Diagnósticos con firma", link: "https://checkout.wompi.co/l/nYpbJV" },
  { id: "diag-estab", name: "Diagnóstico de establecimiento en sitio", desc: "Visita técnica y evaluación integral de su establecimiento.", price: 199900, cat: "Diagnósticos con firma", link: "https://checkout.wompi.co/l/evBpHn" },
  { id: "concepto", name: "Concepto ambiental express", desc: "Concepto técnico preliminar firmado por ingeniero con matrícula profesional.", price: 149900, cat: "Trámites y conceptos", link: "https://checkout.wompi.co/l/6ZpKGZ" },
  { id: "rev-rua", name: "Revisión de RUA", desc: "Revisión técnica de su Registro Único Ambiental antes de radicar.", price: 99900, cat: "Trámites y conceptos", link: "https://checkout.wompi.co/l/Cdl91B" },
  { id: "prep-rua", name: "Preparación de información para RUA", desc: "Consolidamos y organizamos su información lista para radicar.", price: 149900, cat: "Trámites y conceptos", link: "https://checkout.wompi.co/l/gR3mQd" },
  { id: "rev-pma", name: "Revisión de Plan de Manejo Ambiental", desc: "Revisión de suficiencia técnica de su PMA.", price: 199900, cat: "Trámites y conceptos", link: "https://checkout.wompi.co/l/P3EeMT" },

  /* --- Formulación de documentos técnicos: se cotizan según alcance --- */
  { id: "form-psmv", name: "Plan de Saneamiento Básico", desc: "Formulación completa del plan para su establecimiento: diagnóstico, programas de manejo, cronograma e indicadores. Incluye visita técnica.", price: 600000, desde: true, plazo: "8 a 12 días hábiles", cotiza: true, cat: "Formulación de documentos" },
  { id: "form-pgirs", name: "Plan de Gestión Integral de Residuos Sólidos", desc: "PGIRS empresarial formulado según su actividad: caracterización de residuos, programas, metas de aprovechamiento y seguimiento.", price: 800000, desde: true, plazo: "7 días hábiles", cotiza: true, cat: "Formulación de documentos" },
  { id: "form-respel", name: "Plan de Gestión Integral de RESPEL", desc: "Plan de manejo de residuos peligrosos con categorización de generador, rutas internas, contingencias y formatos de control.", price: 700000, desde: true, plazo: "7 a 10 días hábiles", cotiza: true, cat: "Formulación de documentos" },
  { id: "form-pgirasa", name: "PGIRASA — Sector salud", desc: "Plan de Gestión Integral de Residuos Generados en la Atención en Salud. Incluye formulación, capacitación al personal y acompañamiento en la visita de la Secretaría de Salud. Para IPS, consultorios, laboratorios, veterinarias, estética y funerarias.", price: 1200000, desde: true, plazo: "10 a 15 días hábiles", cotiza: true, cat: "Formulación de documentos" },
  { id: "form-pma", name: "Plan de Manejo Ambiental", desc: "Formulación de PMA para proyectos de infraestructura y obra civil. El alcance y el valor dependen del tipo de proyecto, su magnitud y localización.", price: 0, cotiza: true, plazo: "según proyecto", cat: "Formulación de documentos" },

  /* --- Diseño y topografía --- */
  { id: "dis-hidro", name: "Diseño de redes hidrosanitarias", desc: "Cálculo y diseño de redes de acueducto, sanitarias y de aguas lluvias. Incluye memorias de cálculo, planos y especificaciones técnicas firmadas.", price: 1500000, desde: true, plazo: "10 a 20 días hábiles", cotiza: true, cat: "Diseño y topografía" },
  { id: "top-predial", name: "Levantamiento y plano predial", desc: "Levantamiento topográfico con georreferenciación, cálculo de área y linderos. Plano en formato exigido por la oficina de catastro o el IGAC.", price: 800000, desde: true, plazo: "5 a 10 días hábiles", cotiza: true, cat: "Diseño y topografía" },
  { id: "cartografia", name: "Planos cartográficos y georreferenciación", desc: "Elaboración de cartografía temática para estudios ambientales y proyectos: localización, uso del suelo, áreas de influencia y componentes del proyecto.", price: 600000, desde: true, plazo: "5 a 12 días hábiles", cotiza: true, cat: "Diseño y topografía" },
];

const fmt = (n: number) => "$" + n.toLocaleString("es-CO");

function Semaforo({ level }: { level: "rojo" | "amarillo" | "verde" }) {
  const colors = { rojo: "#C1442E", amarillo: "#C99A3A", verde: "#1F5C38" };
  return (
    <div className="flex flex-col gap-2 bg-[#16211B] p-3 rounded-2xl w-fit">
      {(["rojo", "amarillo", "verde"] as const).map((c) => (
        <span key={c} className="w-6 h-6 rounded-full block transition-opacity"
          style={{ background: colors[c], opacity: level === c ? 1 : 0.18 }} />
      ))}
    </div>
  );
}

export default function EcocheckSection() {
  const [tab, setTab] = useState<"diagnostico" | "tienda" | "planes" | "recursos">("diagnostico");
  const [registros, setRegistros] = useState<RegistroMensual[]>([]);
  const [step, setStep] = useState<"intro" | "tipo" | "depto" | "quiz" | "bitacora" | "resultado">("intro");
  const [tipo, setTipo] = useState("");
  const [depto, setDepto] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [qIndex, setQIndex] = useState(0);

  /* Preguntas visibles: se omiten las condicionales no aplicables */
  const aplicables = QUESTIONS.filter(
    (q) => !q.soloSi || answers[q.soloSi.id] === q.soloSi.valor
  );

  let score = 0;
  const riesgos: string[] = [];
  aplicables.forEach((q) => {
    const v = answers[q.id];
    if (!v) return;
    if (q.opciones) {
      // Las preguntas de rango puntúan según la respuesta, no por sí/no
      if (q.id === "q1b" && ["mediano", "gran"].includes(v)) {
        score += 2; riesgos.push(q.tag);
      } else if (q.id === "q1b" && v === "no_se") {
        score++; riesgos.push("Generación no cuantificada");
      } else if (q.id === "q3" && ["fuente", "pozo"].includes(v)) {
        score += 2; riesgos.push("Vertimiento fuera de alcantarillado");
      } else if (q.id === "q3" && v === "alcantarillado") {
        riesgos.push("Trampa de grasas");
      }
      return;
    }
    const positive = q.inverse ? v === "no" : v === "si";
    if (positive) { score++; riesgos.push(q.tag); }
  });

  const total = aplicables.length;
  const level: "rojo" | "amarillo" | "verde" =
    score >= Math.ceil(total * 0.55) ? "rojo"
    : score >= Math.ceil(total * 0.30) ? "amarillo"
    : "verde";

  /* Datos derivados para el resultado accionable */
  const rangoRespel = answers["q1"] === "si" ? (answers["q1b"] || "no_se") : "no_genera";
  const mesesRegistro = answers["q1c"] || "";

  const answer = (v: string) => {
    const q = aplicables[qIndex];
    if (qIndex === 0) eventoPersonalizado("DiagnosticoIniciado");
    let nuevas: Record<string, string> = { ...answers, [q.id]: v };

    // Al cambiar una pregunta padre, se limpian sus dependientes
    const dependientes = QUESTIONS.filter((x) => x.soloSi?.id === q.id);
    if (dependientes.length > 0 && v !== q.soloSi?.valor) {
      dependientes.forEach((d) => {
        if (nuevas[d.id] !== undefined && v !== d.soloSi!.valor) delete nuevas[d.id];
      });
    }
    setAnswers(nuevas);

    // Recalcular aplicables con la respuesta recién dada
    const siguientes = QUESTIONS.filter(
      (x) => !x.soloSi || nuevas[x.soloSi.id] === x.soloSi.valor
    );

    if (qIndex < siguientes.length - 1) setQIndex(qIndex + 1);
    else {
      eventoPersonalizado("DiagnosticoCompletado", {
        tipo_negocio: tipo,
        departamento: depto,
      });
      /* Si genera RESPEL, ofrecer la bitácora antes del resultado */
      setStep(nuevas["q1"] === "si" ? "bitacora" : "resultado");
    }
  };

  const reset = () => { setStep("intro"); setTipo(""); setDepto(""); setAnswers({}); setQIndex(0); setRegistros([]); };

  return (
    <section id="ecocheck" className="py-24 bg-[#16211B] text-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-[#9FD9B6] text-xs font-bold tracking-[2px] uppercase mb-3">
            Automatización ambiental
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">SOSING ECOCHECK</h2>
          <p className="text-[#C9D6CF] text-lg max-w-2xl mx-auto">
            La plataforma que mantiene su negocio en regla con la autoridad ambiental —
            todo el año, en cualquier departamento de Colombia.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-12 flex-wrap">
          {([["diagnostico", "Diagnóstico gratis"], ["planes", "Suscripción 24/7"], ["tienda", "Servicios con firma"], ["recursos", "Guías gratuitas"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition ${
                tab === id ? "bg-[#C99A3A] text-[#241804]" : "border border-white/25 text-white hover:bg-white/10"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* DIAGNÓSTICO */}
        {tab === "diagnostico" && (
          <div className="max-w-2xl mx-auto bg-[#F7F5EF] text-[#16211B] rounded-2xl p-8 shadow-2xl">
            {step === "intro" && (
              <div className="text-center">
                <div className="flex justify-center mb-6"><Semaforo level="rojo" /></div>
                <h3 className="text-2xl font-extrabold mb-3">¿Tu negocio está en regla?</h3>
                <p className="text-[#5C6A62] mb-7">
                  Responde 11 preguntas y obtén tu semáforo de riesgo ambiental, con la autoridad
                  competente identificada automáticamente.
                </p>
                <button onClick={() => setStep("tipo")}
                  className="w-full bg-[#1F5C38] text-white py-4 rounded-lg font-bold hover:bg-[#123C25] transition">
                  Empezar diagnóstico gratis →
                </button>
              </div>
            )}

            {step === "tipo" && (
              <div>
                <div className="text-xs uppercase tracking-wider text-[#8A9188] mb-2">Paso 1 de 3</div>
                <h3 className="text-xl font-extrabold mb-5">¿Qué tipo de negocio tienes?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {BUSINESS_TYPES.map((b) => (
                    <button key={b} onClick={() => { setTipo(b); setStep("depto"); }}
                      className="border border-[#E1E7E2] rounded-lg p-3.5 text-sm text-left hover:border-[#1F5C38] transition">
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === "depto" && (
              <div>
                <div className="text-xs uppercase tracking-wider text-[#8A9188] mb-2">Paso 2 de 3</div>
                <h3 className="text-xl font-extrabold mb-5">¿En qué departamento operas?</h3>
                <select value={depto} onChange={(e) => setDepto(e.target.value)}
                  className="w-full border border-[#E1E7E2] rounded-lg p-3.5 text-base bg-white">
                  <option value="">Selecciona tu departamento</option>
                  {Object.keys(CARS).sort().map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {depto && (
                  <p className="text-sm text-[#5C6A62] mt-3">
                    Autoridad ambiental: <strong className="text-[#16211B]">{CARS[depto]}</strong>
                  </p>
                )}
                <button disabled={!depto} onClick={() => setStep("quiz")}
                  className="w-full mt-6 bg-[#1F5C38] text-white py-4 rounded-lg font-bold disabled:opacity-40 hover:bg-[#123C25] transition">
                  Continuar →
                </button>
              </div>
            )}

            {step === "quiz" && aplicables[qIndex] && (
              <div>
                <div className="text-xs uppercase tracking-wider text-[#8A9188] mb-2">
                  Pregunta {qIndex + 1} de {aplicables.length}
                </div>
                <div className="h-1 bg-[#E1E7E2] rounded mb-6">
                  <div className="h-1 bg-[#1F5C38] rounded transition-all"
                    style={{ width: `${(qIndex / aplicables.length) * 100}%` }} />
                </div>
                <div className="text-xs uppercase tracking-wider text-[#C99A3A] font-bold mb-2">
                  {aplicables[qIndex].tag}
                </div>
                <h3 className="text-xl font-extrabold mb-6">{aplicables[qIndex].text}</h3>

                {aplicables[qIndex].opciones ? (
                  <div className="flex flex-col gap-2.5">
                    {aplicables[qIndex].opciones!.map((o) => (
                      <button key={o.valor} onClick={() => answer(o.valor)}
                        className="w-full text-left border border-[#E1E7E2] rounded-lg py-3.5 px-4 font-semibold hover:border-[#1F5C38] hover:bg-[#F4F6F2] transition">
                        {o.texto}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => answer("si")}
                      className="flex-1 border border-[#E1E7E2] rounded-lg py-4 font-semibold hover:border-[#1F5C38] transition">Sí</button>
                    <button onClick={() => answer("no")}
                      className="flex-1 border border-[#E1E7E2] rounded-lg py-4 font-semibold hover:border-[#1F5C38] transition">No</button>
                  </div>
                )}
              </div>
            )}

            {step === "bitacora" && (
              <BitacoraRespel
                onListo={(r) => { setRegistros(r); setStep("resultado"); }}
                onOmitir={() => { setRegistros([]); setStep("resultado"); }}
              />
            )}

            {step === "resultado" && (
              <div>
                <div className="flex items-center gap-5 mb-6">
                  <Semaforo level={level} />
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#5C6A62]">Tu perfil ambiental</div>
                    <div className="text-2xl font-extrabold">
                      {level === "verde" && "Riesgo bajo"}
                      {level === "amarillo" && "Riesgo medio"}
                      {level === "rojo" && "Riesgo alto"}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#E1E7E2] rounded-xl p-5 mb-5">
                  <div className="text-sm text-[#5C6A62] mb-1">Autoridad ambiental competente</div>
                  <div className="font-bold mb-4">{CARS[depto]}</div>
                  <div className="text-sm text-[#5C6A62] mb-2">
                    Obligaciones identificadas ({riesgos.length})
                  </div>
                  {riesgos.length === 0 ? (
                    <div className="text-sm">No se identificaron riesgos evidentes.</div>
                  ) : riesgos.map((r) => (
                    <div key={r} className="flex items-center gap-2 py-1.5 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C1442E]" />{r}
                    </div>
                  ))}
                </div>

                {/* Plan de acción concreto */}
                <div className="mt-6 mb-6">
                  <ResultadoAccionable
                    autoridad={CARS[depto] || "su autoridad ambiental"}
                    departamento={depto}
                    generaRespel={answers["q1"] === "si"}
                    rangoRespel={rangoRespel}
                    mesesRegistro={mesesRegistro}
                    registros={registros}
                    generaACU={answers["q2"] === "si"}
                    destinoVertimiento={answers["q3"] || ""}
                    nivelRiesgo={level === "rojo" ? "ALTO" : level === "amarillo" ? "MEDIO" : "BAJO"}
                  />
                </div>

                <CapturaProspecto
                  tipoNegocio={tipo}
                  departamento={depto}
                  autoridad={CARS[depto] || "Por determinar"}
                  nivelRiesgo={level === "rojo" ? "ALTO" : level === "amarillo" ? "MEDIO" : "BAJO"}
                  riesgos={riesgos}
                />

                <div className="border border-[#9FD9B6] bg-[#F0F7F2] rounded-xl p-5 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-[#1F5C38] rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-[#16211B] mb-1">Empiece por aquí, sin costo</div>
                      <p className="text-sm text-[#5C6A62] leading-relaxed mb-3">
                        Descargue nuestras guías prácticas con los formatos, el código de colores
                        vigente y los contactos de su autoridad ambiental.
                      </p>
                      <button onClick={() => setTab("recursos")}
                        className="text-sm font-bold text-[#1F5C38] hover:underline">
                        Ver guías gratuitas →
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#16211B] text-white rounded-xl p-6 mb-4">
                  <div className="text-lg font-extrabold mb-1">Diagnóstico Ambiental Express</div>
                  <p className="text-sm text-[#C9D6CF] mb-4">
                    Informe completo en PDF con plazos, riesgo de sanción y checklist de documentos.
                  </p>
                  <div className="text-3xl font-extrabold mb-4">{fmt(49900)}</div>
                  <a href="https://checkout.wompi.co/l/65IJJb" target="_blank" rel="noopener noreferrer"
                    className="block text-center bg-[#C99A3A] text-[#241804] py-3.5 rounded-lg font-bold hover:bg-[#B4872F] transition">
                    Pagar con Wompi →
                  </a>
                </div>

                <div className="border-2 border-[#1F5C38] rounded-xl p-6 mb-4 bg-[#F2F5F2]">
                  <div className="inline-block bg-[#1F5C38] text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 tracking-wide">
                    LO MÁS RECOMENDADO
                  </div>
                  <div className="text-lg font-extrabold mb-1">¿Y el mes que viene?</div>
                  <p className="text-sm text-[#5C6A62] mb-4">
                    El diagnóstico le dice dónde está hoy. La plataforma <strong>SOSING Ambiental 24/7</strong> lleva
                    su cumplimiento todo el año: calcula su categoría de generador, controla certificados,
                    le avisa antes de cada vencimiento y genera sus informes firmados.
                  </p>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-extrabold text-[#1F5C38]">{fmt(79900)}</span>
                    <span className="text-sm text-[#5C6A62]">/mes</span>
                  </div>
                  <button onClick={() => setTab("planes")}
                    className="w-full bg-[#1F5C38] text-white py-3.5 rounded-lg font-bold hover:bg-[#123C25] transition">
                    Ver cómo funciona →
                  </button>
                </div>

                <p className="text-xs text-[#8A9188] leading-relaxed mb-4">
                  Este diagnóstico es una guía orientativa y no constituye un concepto técnico oficial
                  ni una certificación ante la autoridad ambiental. En casos de riesgo alto, un
                  profesional de SOSING revisa el caso antes de la entrega final.
                </p>
                <button onClick={reset}
                  className="w-full border border-[#E1E7E2] rounded-lg py-3 text-sm font-semibold hover:border-[#1F5C38] transition">
                  Hacer otro diagnóstico
                </button>
              </div>
            )}
          </div>
        )}

        {/* TIENDA */}
        {tab === "tienda" && (
          <div>
            <div className="max-w-3xl mx-auto text-center mb-10">
              <h3 className="text-2xl font-bold mb-3">Servicios firmados por ingeniero</h3>
              <p className="text-[#C9D6CF] leading-relaxed">
                Un documento firmado por un profesional con matrícula tiene validez ante la
                autoridad ambiental. Aquí no vendemos información: entregamos criterio técnico
                con responsabilidad profesional detrás.
              </p>
              <p className="text-sm text-[#9FA9A3] leading-relaxed mt-4">
                Los servicios de formulación, diseño y topografía se cotizan según el alcance
                de cada caso. Escríbanos con los datos de su proyecto y le confirmamos valor
                y plazo el mismo día.
              </p>
            </div>

            {["Formulación de documentos", "Diseño y topografía", "Respuesta a la autoridad", "Diagnósticos con firma", "Trámites y conceptos"].map((cat) => (
              <div key={cat} className="mb-10">
                <div className="text-[#9FD9B6] text-xs font-bold tracking-[1.5px] uppercase mb-4">
                  {cat}
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SERVICIOS.filter((s) => s.cat === cat).map((s) => (
                    <div key={s.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col hover:border-[#C99A3A]/40 transition">
                      <div className="font-bold mb-2 leading-snug">{s.name}</div>
                      <p className="text-sm text-[#9FA9A3] leading-relaxed flex-1 mb-3">{s.desc}</p>
                      {s.plazo && (
                        <div className="flex items-center gap-1.5 text-xs text-[#9FD9B6] mb-3">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Entrega: {s.plazo}
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        {s.price > 0 ? (
                          <span className="text-xl font-extrabold text-[#C99A3A]">
                            {s.desde && <span className="text-xs font-semibold text-[#9FA9A3] mr-1">desde</span>}
                            {fmt(s.price)}
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-[#9FA9A3]">Según proyecto</span>
                        )}
                        {s.cotiza ? (
                          <a
                            href={`https://wa.me/573116608217?text=${encodeURIComponent(
                              `Hola, vengo de sosinggroup.com. Quisiera cotizar el servicio de ${s.name} para mi empresa.`
                            )}`}
                            target="_blank" rel="noopener noreferrer"
                            className="bg-[#C99A3A] text-[#241804] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#B4872F] transition">
                            Cotizar
                          </a>
                        ) : (
                          <a href={s.link} target="_blank" rel="noopener noreferrer"
                            className="bg-[#C99A3A] text-[#241804] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#B4872F] transition">
                            Solicitar
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="max-w-2xl mx-auto mt-10 bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
              <p className="text-sm text-[#C9D6CF] leading-relaxed">
                Los servicios que requieren datos de campo (caracterización, aforos, visita en sitio)
                se entregan en el plazo acordado, no de forma inmediata. Le confirmamos tiempos
                al recibir su solicitud.
              </p>
            </div>
          </div>
        )}

        {tab === "recursos" && (
          <div>
            <div className="max-w-3xl mx-auto text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#9FD9B6]/15 border border-[#9FD9B6]/30 rounded-full mb-4">
                <span className="w-2 h-2 bg-[#9FD9B6] rounded-full"></span>
                <span className="text-sm font-semibold text-[#9FD9B6]">Descarga libre</span>
              </div>
              <h3 className="text-2xl font-bold mb-3">Guías prácticas, sin costo</h3>
              <p className="text-[#C9D6CF] leading-relaxed">
                Elaboradas por nuestros ingenieros con la normativa vigente y el contexto real
                de Cesar y La Guajira. Incluyen los datos de contacto de las autoridades, los
                programas posconsumo y los formatos que le van a pedir.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {RECURSOS.map((r) => (
                <a key={r.id} href={r.file} target="_blank" rel="noopener noreferrer"
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col hover:border-[#9FD9B6]/50 hover:bg-white/10 transition group">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#9FD9B6] bg-[#9FD9B6]/10 px-2 py-1 rounded">
                      {r.para}
                    </span>
                    <span className="text-xs text-[#9FA9A3] whitespace-nowrap">{r.pages} pág.</span>
                  </div>
                  <div className="font-bold mb-2 leading-snug group-hover:text-[#9FD9B6] transition">{r.name}</div>
                  <p className="text-sm text-[#9FA9A3] leading-relaxed flex-1 mb-4">{r.desc}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-[#9FD9B6]">
                    Descargar PDF
                    <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </span>
                </a>
              ))}
            </div>

            <div className="max-w-2xl mx-auto mt-10 bg-[#25382E] border border-white/10 rounded-2xl p-6 text-center">
              <div className="font-bold mb-2">¿Le sirvió el material?</div>
              <p className="text-sm text-[#C9D6CF] leading-relaxed mb-5">
                Estas guías le dicen qué debe hacer. Si prefiere que nosotros lo mantengamos
                al día —con alertas antes de cada vencimiento y sus informes firmados—
                esa es la suscripción SOSING Ambiental 24/7.
              </p>
              <button onClick={() => setTab("planes")}
                className="bg-[#C99A3A] text-[#241804] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#B4872F] transition">
                Ver la suscripción
              </button>
            </div>
          </div>
        )}

        {tab === "planes" && (
          <div>
            {/* HÉROE: suscripción */}
            <div className="bg-gradient-to-br from-[#1F5C38] to-[#123C25] rounded-2xl p-8 md:p-10 mb-8">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-block bg-[#C99A3A] text-[#241804] text-[11px] font-extrabold px-3 py-1 rounded-full mb-4 tracking-wide">
                    LA FORMA INTELIGENTE DE CUMPLIR
                  </div>
                  <h3 className="text-3xl md:text-4xl font-extrabold mb-4">SOSING Ambiental 24/7</h3>
                  <p className="text-[#C9D6CF] mb-6 leading-relaxed">
                    No es un PDF que se archiva y se olvida. Es una plataforma que lleva el cumplimiento
                    ambiental de su negocio todo el año, le avisa antes de cada vencimiento y respalda
                    sus informes con la firma de un ingeniero.
                  </p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-5xl font-extrabold">{fmt(79900)}</span>
                    <span className="text-[#9FD9B6]">/mes</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-6">
                    <p className="text-xs text-[#C9D6CF] leading-relaxed">
                      <strong className="text-white">Cómo funciona el cobro:</strong> usted paga el primer mes
                      al activar. Cada mes le enviamos el enlace para renovar. No guardamos su tarjeta
                      ni le hacemos cobros automáticos. Si algún mes no desea continuar, simplemente
                      no renueva.
                    </p>
                  </div>
                  <a href="https://checkout.wompi.co/l/3dDrd4" target="_blank" rel="noopener noreferrer"
                    className="inline-block bg-[#C99A3A] text-[#241804] px-8 py-4 rounded-lg font-extrabold hover:bg-[#B4872F] transition">
                    Activar mi plataforma →
                  </a>
                </div>

                {/* Módulos */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="text-xs uppercase tracking-wider text-[#9FD9B6] font-bold mb-4">
                    Módulos incluidos
                  </div>
                  {[
                    ["RESPEL", "Calcula su categoría de generador automáticamente y controla certificados."],
                    ["Residuos sólidos", "Tasa de aprovechamiento y base para su PGIRS."],
                    ["Aceite de cocina usado", "Control de entregas a gestor autorizado."],
                    ["Obra / RCD", "Trazabilidad de escombros por obra."],
                    ["Calendario", "Alertas antes de cada vencimiento normativo."],
                    ["Informes firmados", "Consolidados revisados por un ingeniero de SOSING."],
                  ].map(([n, d]) => (
                    <div key={n} className="flex gap-3 py-2.5 border-b border-white/10 last:border-0">
                      <span className="text-[#C99A3A] font-bold shrink-0">✓</span>
                      <div>
                        <div className="font-bold text-sm">{n}</div>
                        <div className="text-xs text-[#C9D6CF] mt-0.5">{d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Por qué la suscripción y no un pago único */}
            <div className="max-w-3xl mx-auto mt-12">
              <div className="text-center mb-6">
                <div className="text-lg font-bold">¿Por qué una suscripción y no un documento?</div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="text-[#9FD9B6] font-bold text-sm mb-2">El cumplimiento no es de una vez</div>
                  <p className="text-sm text-[#9FA9A3] leading-relaxed">
                    Cada mes genera residuos. Cada trimestre vence algo. Un documento le sirve hoy;
                    dentro de seis meses ya está desactualizado.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="text-[#9FD9B6] font-bold text-sm mb-2">Las alertas evitan la multa</div>
                  <p className="text-sm text-[#9FA9A3] leading-relaxed">
                    El sistema le avisa antes de cada vencimiento. Una sola sanción evitada paga
                    varios años de suscripción.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="text-[#9FD9B6] font-bold text-sm mb-2">Sus informes van firmados</div>
                  <p className="text-sm text-[#9FA9A3] leading-relaxed">
                    Los reportes que genera la plataforma los revisa y firma un ingeniero con
                    matrícula profesional.
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-2xl mx-auto mt-10 text-center">
              <p className="text-sm text-[#9FA9A3] leading-relaxed">
                ¿Necesita algo puntual en vez de acompañamiento continuo? Revise los{" "}
                <button onClick={() => setTab("tienda")} className="text-[#C99A3A] font-semibold hover:underline">
                  servicios firmados por ingeniero
                </button>.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
