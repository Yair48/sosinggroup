import { NextRequest, NextResponse } from "next/server";

/* ══════════════════════════════════════════════════════════════
   Captura de prospectos del diagnóstico ECOCHECK

   El envío ocurre en el SERVIDOR. No depende de que el usuario
   presione nada después de enviar el formulario.

   Orden de intento:
     1. Resend        si hay RESEND_API_KEY
     2. Webhook       si hay LEADS_WEBHOOK (Zapier, Make, n8n)
     3. FormSubmit    respaldo sin configuración

   Siempre responde éxito al usuario si al menos uno funcionó.
   ══════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORREO_DESTINO = process.env.LEADS_EMAIL || "comercial@sosinggroup.com";
const RESEND_KEY = process.env.RESEND_API_KEY || "";
const WEBHOOK = process.env.LEADS_WEBHOOK || "";
const FORMSUBMIT = process.env.FORMSUBMIT_ID || "";
const WEB3FORMS = process.env.WEB3FORMS_KEY || "";

type Lead = {
  nombre: string;
  empresa?: string;
  email: string;
  telefono?: string;
  tipoNegocio?: string;
  departamento?: string;
  autoridad?: string;
  nivelRiesgo?: string;
  riesgos?: string[];
};

/* ── Correo que recibe SOSING ─────────────────────────────── */
function correoInterno(d: Lead) {
  const riesgos = d.riesgos?.length
    ? d.riesgos.map((r) => `<li style="margin-bottom:4px">${escapar(r)}</li>`).join("")
    : "<li>No se identificaron riesgos evidentes</li>";

  const color =
    d.nivelRiesgo === "ALTO" ? "#A8402C" :
    d.nivelRiesgo === "MEDIO" ? "#B4872F" : "#1F5C38";

  return `
<div style="font-family:Arial,sans-serif;max-width:640px;color:#16211B">
  <div style="background:#16211B;padding:20px 24px">
    <div style="color:#9FD9B6;font-size:12px;letter-spacing:2px">SOSING ECOCHECK</div>
    <div style="color:#fff;font-size:20px;font-weight:bold;margin-top:4px">
      Nuevo diagnóstico completado
    </div>
  </div>

  <div style="border:1px solid #DDE3DC;border-top:none;padding:22px 24px">

    <div style="background:${color};color:#fff;display:inline-block;
                padding:6px 14px;border-radius:4px;font-weight:bold;margin-bottom:18px">
      Riesgo ${escapar(d.nivelRiesgo || "no determinado")}
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:7px 0;color:#68756D;width:150px">Nombre</td>
          <td style="padding:7px 0;font-weight:bold">${escapar(d.nombre)}</td></tr>
      ${d.empresa ? `<tr><td style="padding:7px 0;color:#68756D">Empresa</td>
          <td style="padding:7px 0">${escapar(d.empresa)}</td></tr>` : ""}
      <tr><td style="padding:7px 0;color:#68756D">Correo</td>
          <td style="padding:7px 0"><a href="mailto:${escapar(d.email)}">${escapar(d.email)}</a></td></tr>
      ${d.telefono ? `<tr><td style="padding:7px 0;color:#68756D">Celular</td>
          <td style="padding:7px 0">
            <a href="https://wa.me/57${d.telefono.replace(/\D/g, "")}">${escapar(d.telefono)}</a>
          </td></tr>` : ""}
      <tr><td style="padding:7px 0;color:#68756D">Actividad</td>
          <td style="padding:7px 0">${escapar(d.tipoNegocio || "—")}</td></tr>
      <tr><td style="padding:7px 0;color:#68756D">Departamento</td>
          <td style="padding:7px 0">${escapar(d.departamento || "—")}</td></tr>
      <tr><td style="padding:7px 0;color:#68756D">Autoridad</td>
          <td style="padding:7px 0;font-weight:bold">${escapar(d.autoridad || "—")}</td></tr>
    </table>

    <div style="margin-top:20px;font-size:14px">
      <div style="font-weight:bold;margin-bottom:8px">Obligaciones identificadas</div>
      <ul style="margin:0;padding-left:20px;color:#3a4741">${riesgos}</ul>
    </div>

    ${d.telefono ? `
    <div style="margin-top:24px;text-align:center">
      <a href="https://wa.me/57${d.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Buen día ${d.nombre.split(" ")[0]}, le escribo de SOSING. Vi que hizo el diagnóstico ambiental en nuestra página y quisiera comentarle el resultado.`
      )}"
         style="background:#25D366;color:#fff;padding:12px 24px;text-decoration:none;
                border-radius:6px;font-weight:bold;display:inline-block">
        Escribirle por WhatsApp
      </a>
    </div>` : ""}

    <div style="margin-top:22px;padding-top:16px;border-top:1px solid #DDE3DC;
                font-size:12px;color:#8A9188">
      Recibido el ${new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })}
    </div>
  </div>
</div>`;
}

/* ── Correo que recibe el prospecto ───────────────────────── */
function correoProspecto(d: Lead) {
  const riesgos = d.riesgos?.length
    ? d.riesgos.map((r) => `<li style="margin-bottom:6px">${escapar(r)}</li>`).join("")
    : "<li>No se identificaron obligaciones evidentes con la información suministrada</li>";

  const color =
    d.nivelRiesgo === "ALTO" ? "#A8402C" :
    d.nivelRiesgo === "MEDIO" ? "#B4872F" : "#1F5C38";

  const mensaje =
    d.nivelRiesgo === "ALTO"
      ? "Su establecimiento presenta varias obligaciones ambientales sin atender. Conviene revisarlas pronto."
      : d.nivelRiesgo === "MEDIO"
      ? "Su establecimiento tiene obligaciones ambientales que conviene documentar."
      : "Su establecimiento presenta un panorama favorable, pero conviene mantener los soportes al día.";

  return `
<div style="font-family:Arial,sans-serif;max-width:600px;color:#16211B">
  <div style="background:#1F5C38;padding:22px 24px;border-radius:8px 8px 0 0">
    <div style="color:#9FD9B6;font-size:12px;letter-spacing:2px">SOSING ECOCHECK</div>
    <div style="color:#fff;font-size:21px;font-weight:bold;margin-top:4px">
      Su diagnóstico ambiental
    </div>
  </div>

  <div style="border:1px solid #DDE3DC;border-top:none;padding:26px 24px;border-radius:0 0 8px 8px">

    <p style="font-size:15px;line-height:1.6">Buen día ${escapar(d.nombre.split(" ")[0])},</p>

    <p style="font-size:15px;line-height:1.6">
      Gracias por usar ECOCHECK. Este es el resultado del diagnóstico que respondió.
    </p>

    <div style="background:${color};color:#fff;padding:16px 20px;border-radius:6px;margin:22px 0">
      <div style="font-size:12px;opacity:.9">Nivel de riesgo</div>
      <div style="font-size:26px;font-weight:bold">${escapar(d.nivelRiesgo || "—")}</div>
      <div style="font-size:14px;margin-top:6px;opacity:.95">${mensaje}</div>
    </div>

    <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:20px">
      <tr><td style="padding:6px 0;color:#68756D;width:170px">Actividad</td>
          <td style="padding:6px 0">${escapar(d.tipoNegocio || "—")}</td></tr>
      <tr><td style="padding:6px 0;color:#68756D">Autoridad competente</td>
          <td style="padding:6px 0;font-weight:bold">${escapar(d.autoridad || "—")}</td></tr>
    </table>

    <div style="font-size:15px;font-weight:bold;margin-bottom:10px">
      Obligaciones que le aplican
    </div>
    <ul style="font-size:14px;line-height:1.6;color:#3a4741;padding-left:20px">${riesgos}</ul>

    <div style="background:#F4F6F2;padding:18px 20px;border-radius:6px;margin:24px 0">
      <div style="font-weight:bold;font-size:15px;margin-bottom:8px">
        Guías técnicas sin costo
      </div>
      <p style="font-size:14px;line-height:1.6;color:#68756D;margin:0 0 14px">
        Preparamos guías con los formatos, el código de colores vigente y los datos de
        contacto de su autoridad ambiental. Puede descargarlas libremente.
      </p>
      <a href="https://www.sosinggroup.com/#ecocheck"
         style="background:#1F5C38;color:#fff;padding:11px 22px;text-decoration:none;
                border-radius:6px;font-weight:bold;display:inline-block;font-size:14px">
        Descargar guías
      </a>
    </div>

    <p style="font-size:14px;line-height:1.6;color:#68756D">
      Si quiere que revisemos su caso puntual, escríbanos por WhatsApp al
      <a href="https://wa.me/573116608217" style="color:#1F5C38;font-weight:bold">311 660 8217</a>.
      Le responde un ingeniero, no un contestador.
    </p>

    <p style="font-size:12.5px;line-height:1.6;color:#8A9188;margin-top:22px;
              padding-top:16px;border-top:1px solid #DDE3DC">
      Este diagnóstico es orientativo y se basa en la información que usted suministró.
      No constituye concepto técnico ni certifica el cumplimiento normativo de su
      establecimiento ante la autoridad ambiental.
    </p>

    <div style="font-size:12px;color:#8A9188;line-height:1.6;margin-top:14px">
      <strong>SOSING S.A.S.</strong> · NIT 900.342.838-7<br>
      Av. Simón Bolívar 21-44, Valledupar - Cesar<br>
      comercial@sosinggroup.com · sosinggroup.com
    </div>
  </div>
</div>`;
}

function escapar(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ── Envío por Resend ─────────────────────────────────────── */
async function enviarResend(to: string, subject: string, html: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "SOSING ECOCHECK <ecocheck@sosinggroup.com>",
      to: [to],
      subject,
      html,
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

/* ── Respaldo confiable desde servidor: Web3Forms ─────────────
   A diferencia de FormSubmit, admite llamadas servidor-a-servidor.
   Requiere una clave gratuita de web3forms.com — sin registro,
   se obtiene indicando el correo de destino.
   ─────────────────────────────────────────────────────────── */
async function enviarWeb3Forms(d: Lead) {
  const r = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: WEB3FORMS,
      subject: `ECOCHECK · ${d.nombre} · riesgo ${d.nivelRiesgo}`,
      from_name: "ECOCHECK — SOSING",
      Nombre: d.nombre,
      Empresa: d.empresa || "—",
      Correo: d.email,
      Celular: d.telefono || "—",
      Actividad: d.tipoNegocio || "—",
      Departamento: d.departamento || "—",
      Autoridad: d.autoridad || "—",
      Riesgo: d.nivelRiesgo || "—",
      Obligaciones: (d.riesgos || []).join(" | ") || "—",
    }),
  });

  const json = await r.json().catch(() => null);
  if (!r.ok || !json?.success) {
    throw new Error(`Web3Forms: ${json?.message || `HTTP ${r.status}`}`);
  }
}

/* ── Respaldo: FormSubmit ─────────────────────────────────────
   ADVERTENCIA: FormSubmit valida el origen de la petición y está
   pensado para formularios de navegador. Desde el servidor puede
   rechazar el envío. Se conserva como último recurso, nunca como
   canal principal.

   Devuelve HTTP 200 incluso cuando falla: hay que leer el cuerpo.
   ─────────────────────────────────────────────────────────── */
async function enviarFormSubmit(d: Lead) {
  const destino = FORMSUBMIT || CORREO_DESTINO;
  const r = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(destino)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: `ECOCHECK · ${d.nombre} · riesgo ${d.nivelRiesgo}`,
      Nombre: d.nombre,
      Empresa: d.empresa || "—",
      Correo: d.email,
      Celular: d.telefono || "—",
      Actividad: d.tipoNegocio || "—",
      Departamento: d.departamento || "—",
      Autoridad: d.autoridad || "—",
      Riesgo: d.nivelRiesgo || "—",
      Obligaciones: (d.riesgos || []).join(" | ") || "—",
    }),
  });

  if (!r.ok) throw new Error(`FormSubmit HTTP ${r.status}`);

  /* HTTP 200 no significa entregado. Verificar el cuerpo. */
  const cuerpo = await r.text();
  let json: any = null;
  try { json = JSON.parse(cuerpo); } catch { /* respuesta no JSON */ }

  if (!json) throw new Error("FormSubmit: respuesta no interpretable");

  const exito = json.success === true || json.success === "true";
  if (!exito) {
    throw new Error(`FormSubmit rechazó el envío: ${json.message || "sin detalle"}`);
  }
}

/* ── Handler ──────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  let d: Lead;
  try {
    d = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida" }, { status: 400 });
  }

  if (!d?.nombre?.trim() || !d?.email?.includes("@")) {
    return NextResponse.json({ ok: false, error: "Faltan datos" }, { status: 400 });
  }

  const resultados = { interno: false, prospecto: false, webhook: false };
  const errores: string[] = [];

  // 1. Correo interno a SOSING
  if (RESEND_KEY) {
    try {
      await enviarResend(
        CORREO_DESTINO,
        `ECOCHECK · ${d.nombre} · riesgo ${d.nivelRiesgo}`,
        correoInterno(d)
      );
      resultados.interno = true;
    } catch (e: any) { errores.push(`resend-interno: ${e.message}`); }

    // 2. Correo al prospecto — solo si el interno funcionó
    if (resultados.interno) {
      try {
        await enviarResend(d.email, "Su diagnóstico ambiental — SOSING", correoProspecto(d));
        resultados.prospecto = true;
      } catch (e: any) { errores.push(`resend-prospecto: ${e.message}`); }
    }
  }

  // 3. Webhook al CRM
  if (WEBHOOK) {
    try {
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, fecha: new Date().toISOString(), origen: "ECOCHECK" }),
      });
      resultados.webhook = true;
    } catch (e: any) { errores.push(`webhook: ${e.message}`); }
  }

  // 4. Respaldo desde servidor: Web3Forms
  if (!resultados.interno && !resultados.webhook && WEB3FORMS) {
    try {
      await enviarWeb3Forms(d);
      resultados.interno = true;
    } catch (e: any) { errores.push(`web3forms: ${e.message}`); }
  }

  // 5. Último recurso: FormSubmit.
  //    No es confiable desde el servidor. Solo se intenta si todo lo
  //    demás falló, y su resultado se verifica leyendo el cuerpo.
  if (!resultados.interno && !resultados.webhook) {
    try {
      await enviarFormSubmit(d);
      resultados.interno = true;
    } catch (e: any) { errores.push(`formsubmit: ${e.message}`); }
  }

  /* Solo se reporta éxito cuando un canal confirmó la entrega */
  const entregado = resultados.interno || resultados.webhook;

  if (!entregado) {
    console.error("[ECOCHECK] Lead no entregado:", d.email, errores);
    return NextResponse.json(
      {
        ok: false,
        error: "No pudimos registrar su solicitud",
        /* Diagnóstico sin exponer secretos: qué canales estaban disponibles */
        canales: {
          resend: RESEND_KEY ? "configurado" : "no configurado",
          webhook: WEBHOOK ? "configurado" : "no configurado",
          web3forms: WEB3FORMS
            ? `configurado (${WEB3FORMS.length} caracteres)`
            : "no configurado",
          formsubmit: "último recurso, poco confiable desde servidor",
        },
        /* Detalle del fallo, sin exponer credenciales */
        detalle: errores.map((e) =>
          e.replace(WEB3FORMS || "###", "[clave]")
           .replace(RESEND_KEY || "###", "[clave]")
        ),
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    correoEnviado: resultados.prospecto,
  });
}
