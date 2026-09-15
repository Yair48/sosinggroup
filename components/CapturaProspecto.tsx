"use client";

import { useState } from "react";
import { evento } from "./MetaPixel";

/* ============================================================
   Captura de prospecto tras el diagnóstico
   
   Los datos se envían a un webhook (Zapier, Make, n8n) que los
   lleva al CRM. Si no hay webhook configurado, abre WhatsApp
   con la información para que no se pierda ningún contacto.
   ============================================================ */

// Pegue aquí la URL del webhook de Zapier cuando lo tenga.
// Mientras esté vacío, el formulario envía por WhatsApp.
const WEBHOOK = process.env.NEXT_PUBLIC_LEADS_WEBHOOK || "";

/* Clave pública de Web3Forms.
   Por diseño del servicio, esta clave es pública: va en el HTML de los
   formularios. No es una credencial secreta. Los servicios de formularios
   bloquean peticiones desde servidores (HTTP 403), por lo que el envío
   debe originarse en el navegador del usuario. */
const WEB3FORMS = process.env.NEXT_PUBLIC_WEB3FORMS_KEY || "";
const WHATSAPP = "573116608217";

type Props = {
  tipoNegocio: string;
  departamento: string;
  autoridad: string;
  nivelRiesgo: string;
  riesgos: string[];
};

export default function CapturaProspecto({
  tipoNegocio, departamento, autoridad, nivelRiesgo, riesgos,
}: Props) {
  const [datos, setDatos] = useState({ nombre: "", empresa: "", email: "", tel: "" });
  const [acepta, setAcepta] = useState(false);
  const [estado, setEstado] = useState<"form" | "enviando" | "listo">("form");
  const [correoEnviado, setCorreoEnviado] = useState(false);
  const [error, setError] = useState("");

  const cambiar = (k: string, v: string) => setDatos((d) => ({ ...d, [k]: v }));

  const enviar = async () => {
    if (!datos.nombre.trim()) return setError("Escriba su nombre.");
    if (!datos.email.includes("@")) return setError("Escriba un correo válido.");
    if (!acepta) return setError("Debe autorizar el tratamiento de sus datos.");

    setError("");
    setEstado("enviando");

    const payload = {
      nombre: datos.nombre,
      empresa: datos.empresa,
      email: datos.email,
      telefono: datos.tel,
      tipoNegocio,
      departamento,
      autoridad,
      nivelRiesgo,
      riesgos,
    };

    let entregado = false;
    let correoAlProspecto = false;

    /* 1. Intento por el servidor.
       Funciona cuando hay Resend o un webhook configurado. */
    try {
      const r = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const res = await r.json();
      if (r.ok && res.ok) {
        entregado = true;
        correoAlProspecto = Boolean(res.correoEnviado);
      }
    } catch {
      /* Se continúa con el respaldo */
    }

    /* 2. Respaldo desde el navegador.
       Los servicios de formularios rechazan peticiones de servidor,
       pero aceptan las del navegador del usuario. */
    if (!entregado && WEB3FORMS) {
      try {
        const r = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: WEB3FORMS,
            subject: `ECOCHECK · ${datos.nombre} · riesgo ${nivelRiesgo}`,
            from_name: "ECOCHECK — SOSING",
            Nombre: datos.nombre,
            Empresa: datos.empresa || "—",
            Correo: datos.email,
            Celular: datos.tel || "—",
            Actividad: tipoNegocio || "—",
            Departamento: departamento || "—",
            Autoridad: autoridad || "—",
            Riesgo: nivelRiesgo || "—",
            Obligaciones: riesgos.join(" | ") || "—",
          }),
        });
        const j = await r.json().catch(() => null);
        if (r.ok && j?.success) entregado = true;
      } catch {
        /* Sin canales disponibles */
      }
    }

    if (!entregado) {
      setEstado("form");
      return setError(
        "No pudimos registrar su solicitud. Escríbanos por WhatsApp al 311 660 8217."
      );
    }

    setCorreoEnviado(correoAlProspecto);
    setEstado("listo");
  };

  if (estado === "listo") {
    return (
      <div className="border-2 border-[#1F5C38] bg-[#F0F7F2] rounded-xl p-6 mb-4 text-center">
        <div className="w-12 h-12 bg-[#1F5C38] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="font-bold text-lg text-[#16211B] mb-2">Listo, {datos.nombre.split(" ")[0]}</div>
        <p className="text-sm text-[#5C6A62] leading-relaxed mb-4">
          {correoEnviado
            ? `Le enviamos el detalle a ${datos.email}. Si no lo ve en unos minutos, revise la carpeta de correo no deseado.`
            : "Recibimos sus datos. Un ingeniero de SOSING lo contactará pronto para comentarle el resultado."}
        </p>
        <p className="text-sm text-[#5C6A62] leading-relaxed mb-4">
          Mientras tanto, descargue las guías técnicas que preparamos para su actividad.
        </p>
        <a
          href="#ecocheck"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("ecocheck")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="inline-block bg-[#1F5C38] text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-[#164529] transition"
        >
          Ver guías gratuitas
        </a>
      </div>
    );
  }

  return (
    <div className="border-2 border-[#C99A3A] bg-[#FDF9F2] rounded-xl p-6 mb-4">
      <div className="text-center mb-5">
        <div className="inline-block bg-[#C99A3A] text-[#241804] text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 tracking-wide">
          SIN COSTO
        </div>
        <div className="font-extrabold text-lg text-[#16211B] mb-1">
          Reciba su diagnóstico completo
        </div>
        <p className="text-sm text-[#5C6A62] leading-relaxed">
          Le enviamos el detalle a su correo y un ingeniero queda atento
          a resolverle cualquier duda.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-3 py-2 rounded text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            type="text" placeholder="Su nombre *" value={datos.nombre}
            onChange={(e) => cambiar("nombre", e.target.value)}
            className="w-full px-4 py-3 border border-[#D8DED9] rounded-lg text-sm focus:ring-2 focus:ring-[#1F5C38] focus:border-transparent outline-none"
          />
          <input
            type="text" placeholder="Empresa o negocio" value={datos.empresa}
            onChange={(e) => cambiar("empresa", e.target.value)}
            className="w-full px-4 py-3 border border-[#D8DED9] rounded-lg text-sm focus:ring-2 focus:ring-[#1F5C38] focus:border-transparent outline-none"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            type="email" placeholder="Correo electrónico *" value={datos.email}
            onChange={(e) => cambiar("email", e.target.value)}
            className="w-full px-4 py-3 border border-[#D8DED9] rounded-lg text-sm focus:ring-2 focus:ring-[#1F5C38] focus:border-transparent outline-none"
          />
          <input
            type="tel" placeholder="Celular (opcional)" value={datos.tel}
            onChange={(e) => cambiar("tel", e.target.value)}
            className="w-full px-4 py-3 border border-[#D8DED9] rounded-lg text-sm focus:ring-2 focus:ring-[#1F5C38] focus:border-transparent outline-none"
          />
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
          <input
            type="checkbox" checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#1F5C38] flex-shrink-0"
          />
          <span className="text-xs text-[#5C6A62] leading-relaxed">
            Autorizo el tratamiento de mis datos conforme a la{" "}
            <a href="/politica-datos" target="_blank" className="text-[#1F5C38] font-semibold underline">
              Política de Tratamiento de Datos
            </a>{" "}
            de SOSING S.A.S.
          </span>
        </label>

        <button
          onClick={enviar}
          disabled={estado === "enviando"}
          className="w-full bg-[#1F5C38] text-white py-3.5 rounded-lg font-bold text-sm hover:bg-[#164529] transition disabled:opacity-60"
        >
          {estado === "enviando" ? "Enviando…" : "Enviarme el resultado"}
        </button>

        <p className="text-[11px] text-[#8A9188] text-center leading-relaxed">
          No enviamos publicidad no solicitada. Puede pedir la eliminación de sus datos
          en cualquier momento.
        </p>
      </div>
    </div>
  );
}
