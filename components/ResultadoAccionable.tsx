"use client";

import { useState } from "react";
import {
  cotizar, mensajeCotizacion, SUSCRIPCION, pesos as $,
} from "@/lib/ecocheck-cotizacion";
import {
  clasificarGeneradorRespel, explicarClasificacion,
  type RegistroMensual, type ResultadoClasificacion,
} from "@/lib/ecocheck-motor-respel";
import {
  datosAutoridad, clasificarRespel, obligacionesACU, obligacionesRespel,
  obligacionesVertimientos, NATURALEZA_META, METODO_RESPEL,
  RADICACION, POSCONSUMO,
  type Obligacion, type ResultadoCategoria,
} from "@/lib/ecocheck-reglas";

/* ══════════════════════════════════════════════════════════════
   Resultado con trazabilidad

   Cada salida declara su naturaleza, su norma, su artículo,
   su fuente y su fecha de verificación.
   ══════════════════════════════════════════════════════════════ */

type Props = {
  autoridad: string;
  departamento: string;
  generaRespel: boolean;
  rangoRespel: string;
  mesesRegistro: string;
  registros: RegistroMensual[];
  generaACU: boolean;
  destinoVertimiento: string;
  nivelRiesgo?: string;
};

const C = {
  tinta: "#16211B", verde: "#1F5C38", mint: "#9FD9B6",
  hueso: "#F4F6F2", linea: "#DDE3DC", gris: "#68756D",
  ambar: "#B4872F", ambarFondo: "#FBF3E2",
  rojo: "#A8402C", verdeFondo: "#EDF4EF", morado: "#6B4C8A", grisClaro: "#8A9188",
};

export default function ResultadoAccionable(p: Props) {
  const [abierta, setAbierta] = useState<string | null>(null);
  const [verMetodo, setVerMetodo] = useState(false);

  const aut = datosAutoridad(p.autoridad);
  const nivelRiesgoTexto = p.nivelRiesgo || "MEDIO";

  /* Con bitácora se usa el motor real. Sin ella, el puente declarativo. */
  const usaMotor = p.generaRespel && p.registros.length > 0;

  const motor: ResultadoClasificacion | null = usaMotor
    ? clasificarGeneradorRespel(p.registros, p.rangoRespel)
    : null;

  const puente: ResultadoCategoria = clasificarRespel(
    p.generaRespel ? p.rangoRespel : "no_genera",
    p.mesesRegistro
  );

  /* Vista unificada para el resto del componente */
  const cat: ResultadoCategoria = motor
    ? {
        estado: motor.estado,
        categoria: (motor.categoria === "bajo_umbral" ? "exento" : motor.categoria) as any,
        nombre: motor.nombreCategoria,
        detalle: motor.rangoNormativo,
        mensaje: motor.mensaje,
        exentoRegistro: motor.exentoRegistro === true,
        mesesDisponibles: String(motor.mesesUtilizados),
        fuente: motor.fuente,
      }
    : puente;

  const obligaciones: Obligacion[] = [
    ...(p.generaRespel ? obligacionesRespel(cat) : []),
    ...(p.generaACU ? obligacionesACU() : []),
    ...(p.destinoVertimiento ? obligacionesVertimientos(p.destinoVertimiento) : []),
  ];

  const verificadas = obligaciones.filter((o) => o.naturaleza === "obligacion_verificada");
  const porVerificar = obligaciones.filter((o) => o.naturaleza === "requiere_verificacion");

  const inmediatas = obligaciones.filter((o) => o.urgencia === "inmediata");
  const corto = obligaciones.filter((o) => o.urgencia === "corto");
  const medio = obligaciones.filter((o) => o.urgencia === "medio");

  return (
    <div className="space-y-4">

      {/* ══ Situación ══ */}
      <div style={{ background: C.tinta, borderRadius: 12, padding: "20px 22px", color: "#fff" }}>
        <div style={{ fontSize: 12, color: C.mint, marginBottom: 6 }}>Su situación</div>

        {p.generaRespel && (
          <div style={{ marginBottom: 12 }}>
            {cat.estado === "NO_DETERMINABLE" ? (
              <>
                <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>
                  Categoría de generador no determinable
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "#C9D6CF" }}>
                  {cat.mensaje}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>
                  {cat.nombre}
                  <span style={{
                    fontSize: 11, fontWeight: 700, marginLeft: 10, padding: "3px 9px",
                    borderRadius: 4, verticalAlign: "middle",
                    background: cat.estado === "DETERMINADA" ? C.mint : "rgba(255,255,255,.15)",
                    color: cat.estado === "DETERMINADA" ? C.tinta : "#fff",
                  }}>
                    {cat.estado}
                  </span>
                </div>
                {cat.detalle && (
                  <div style={{ fontSize: 12.5, color: "#9FA9A3", marginBottom: 6 }}>
                    {cat.detalle}
                  </div>
                )}
                {motor?.valorCalculado !== null && motor?.valorCalculado !== undefined && (
                  <div style={{
                    background: "rgba(255,255,255,.08)", borderRadius: 6,
                    padding: "10px 12px", marginTop: 8, marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 11.5, color: C.mint, marginBottom: 3 }}>
                      Media móvil calculada
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>
                      {motor.valorCalculado} <span style={{ fontSize: 13, fontWeight: 400 }}>kg/mes</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#9FA9A3", marginTop: 3 }}>
                      {motor.mesesUtilizados} meses · período {motor.periodoUtilizado}
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 14, lineHeight: 1.6, color: "#C9D6CF" }}>
                  {cat.mensaje}
                </div>
              </>
            )}

            {motor && motor.faltante.length > 0 && (
              <div style={{
                background: "rgba(180,135,47,.18)", borderRadius: 6,
                padding: "11px 13px", marginTop: 10, fontSize: 13, lineHeight: 1.6,
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Para determinarla con certeza</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#C9D6CF" }}>
                  {motor.faltante.map((f) => <li key={f}>{f}</li>)}
                </ul>
              </div>
            )}

            <button
              onClick={() => setVerMetodo(!verMetodo)}
              style={{
                marginTop: 10, background: "none", border: "none", padding: 0,
                color: C.mint, fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", textDecoration: "underline",
              }}
            >
              ¿Por qué ECOCHECK dice esto?
            </button>

            {verMetodo && (
              <div style={{
                marginTop: 12, padding: "14px 16px", borderRadius: 8,
                background: "rgba(255,255,255,.07)", fontSize: 13, lineHeight: 1.65,
              }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{METODO_RESPEL.titulo}</div>
                <p style={{ margin: "0 0 10px", color: "#C9D6CF" }}>{METODO_RESPEL.texto}</p>

                {motor && (() => {
                  const e = explicarClasificacion(motor);
                  return (
                    <div style={{
                      background: "rgba(0,0,0,.2)", borderRadius: 6,
                      padding: "12px 14px", margin: "0 0 12px", fontSize: 12.5,
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>Su caso</div>
                      <div style={{ color: "#C9D6CF", lineHeight: 1.7 }}>
                        <div><strong>Datos:</strong> {e.datoIngresado}</div>
                        {e.calculo && <div><strong>Cálculo:</strong> {e.calculo}</div>}
                        <div><strong>Resultado:</strong> {e.resultado}</div>
                        <div><strong>Confianza:</strong> {e.confianza}</div>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ fontWeight: 600, marginBottom: 4 }}>Umbrales de la norma</div>
                <ul style={{ margin: "0 0 10px", paddingLeft: 18, color: "#C9D6CF" }}>
                  {METODO_RESPEL.umbrales.map((u) => <li key={u}>{u}</li>)}
                </ul>

                <div style={{ fontWeight: 600, marginBottom: 4 }}>Cómo obtener su categoría real</div>
                <ol style={{ margin: "0 0 10px", paddingLeft: 18, color: "#C9D6CF" }}>
                  {METODO_RESPEL.comoObtenerla.map((s) => <li key={s}>{s}</li>)}
                </ol>

                <div style={{ fontSize: 12, color: "#8A9188", paddingTop: 8,
                              borderTop: "1px solid rgba(255,255,255,.12)" }}>
                  {METODO_RESPEL.fuente.norma} · {METODO_RESPEL.fuente.articulo}<br />
                  Verificado el {METODO_RESPEL.fuente.fechaVerificacion} ·
                  fuente nivel {METODO_RESPEL.fuente.nivelFuente} ·
                  confianza {METODO_RESPEL.fuente.confianza}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: 14, lineHeight: 1.6, color: "#C9D6CF",
                      paddingTop: p.generaRespel ? 12 : 0,
                      borderTop: p.generaRespel ? "1px solid rgba(255,255,255,.12)" : "none" }}>
          Su autoridad competente es <strong style={{ color: "#fff" }}>{aut.sigla}</strong>
          {p.departamento && ` para ${p.departamento}`}. Se identifican{" "}
          <strong style={{ color: "#fff" }}>{verificadas.length} obligaciones verificadas</strong>
          {porVerificar.length > 0 && (
            <> y <strong style={{ color: "#fff" }}>{porVerificar.length} puntos que requieren
            verificación</strong></>
          )}.
        </div>
      </div>

      {/* ══ Autoridad ══ */}
      <div style={{ background: "#fff", border: `1px solid ${C.linea}`, borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.gris, marginBottom: 10 }}>
          Dónde debe responder
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.verde, marginBottom: 4 }}>
          {aut.nombre}
        </div>

        {aut.verificado ? (
          <>
            <div style={{ fontSize: 13.5, color: C.gris, lineHeight: 1.7 }}>
              {aut.direccion && <div>{aut.direccion}</div>}
              {aut.telefono && (
                <div>
                  Teléfono {aut.telefono}
                  {aut.lineaGratuita && ` · línea gratuita ${aut.lineaGratuita}`}
                </div>
              )}
              {aut.horario && <div>{aut.horario}</div>}
            </div>
            <div style={{ fontSize: 11.5, color: "#8A9188", marginTop: 8 }}>
              Fuente: {aut.fuenteDatos} · verificado {aut.fechaVerificacion} ·
              nivel {aut.nivelFuente}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 13.5, color: C.gris, lineHeight: 1.6 }}>
            Información específica de esta autoridad pendiente de verificación.
            {aut.web && <> Consulte en <strong>{aut.web}</strong>.</>}
          </div>
        )}

        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.hueso}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Cómo se radica</div>
          <div style={{ fontSize: 13, color: C.gris, lineHeight: 1.6 }}>
            La mayoría de trámites se gestionan por <strong>{RADICACION.plataforma}</strong>:{" "}
            {RADICACION.url}
          </div>
          <ol style={{ fontSize: 13, color: C.gris, lineHeight: 1.7, margin: "8px 0 0", paddingLeft: 18 }}>
            {RADICACION.pasos.map((s) => <li key={s}>{s}</li>)}
          </ol>
          <div style={{ fontSize: 12, color: "#8A9188", marginTop: 8, fontStyle: "italic" }}>
            {RADICACION.nota}
          </div>
        </div>
      </div>

      {/* ══ Obligaciones por urgencia ══ */}
      {inmediatas.length > 0 && (
        <Bloque titulo="Atender de inmediato" acciones={inmediatas}
          abierta={abierta} setAbierta={setAbierta} />
      )}
      {corto.length > 0 && (
        <Bloque titulo="En las próximas semanas" acciones={corto}
          abierta={abierta} setAbierta={setAbierta} />
      )}
      {medio.length > 0 && (
        <Bloque titulo="Para el mediano plazo" acciones={medio}
          abierta={abierta} setAbierta={setAbierta} />
      )}

      {/* ══ Cotización ══ */}
      {(() => {
        const cot = cotizar(obligaciones.map((o) => o.id), nivelRiesgoTexto);
        if (!cot) return null;

        const wa = `https://wa.me/573116608217?text=${encodeURIComponent(
          mensajeCotizacion(cot, {
            tipoNegocio: p.departamento,
            departamento: p.departamento,
            nivelRiesgo: nivelRiesgoTexto,
          })
        )}`;

        return (
          <div style={{
            background: "#fff", border: `2px solid ${C.verde}`,
            borderRadius: 12, overflow: "hidden",
          }}>
            <div style={{ background: C.verde, padding: "16px 20px", color: "#fff" }}>
              <div style={{ fontSize: 12, color: C.mint, marginBottom: 3 }}>
                Nosotros lo resolvemos
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.35 }}>
                {cot.mensaje}
              </div>
            </div>

            <div style={{ padding: "18px 20px" }}>
              {cot.lineas.map((l) => (
                <div key={l.servicio.id} style={{
                  paddingBottom: 16, marginBottom: 16,
                  borderBottom: `1px solid ${C.hueso}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                                gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.tinta, flex: 1, minWidth: 180 }}>
                      {l.servicio.nombre}
                    </div>
                    <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 11.5, color: C.gris }}>desde</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: C.verde }}>
                        {$(l.servicio.desde)}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: 13.5, color: C.gris, lineHeight: 1.6, margin: "0 0 10px" }}>
                    {l.servicio.descripcion}
                  </p>

                  <div style={{ display: "grid", gap: 4, marginBottom: 8 }}>
                    {l.servicio.incluye.map((i) => (
                      <div key={i} style={{ fontSize: 13, color: C.gris, display: "flex", gap: 7 }}>
                        <span style={{ color: C.verde, fontWeight: 700 }}>✓</span>
                        {i}
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 12.5, color: C.grisClaro }}>
                    Entrega: {l.servicio.plazo}
                  </div>
                </div>
              ))}

              {/* Total */}
              <div style={{
                background: C.hueso, borderRadius: 8, padding: "14px 16px",
                marginBottom: 16,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                              alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: C.gris }}>
                    {cot.lineas.length === 1 ? "Valor" : `${cot.lineas.length} servicios, desde`}
                  </span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: C.verde }}>
                    {$(cot.desde)}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: C.gris, lineHeight: 1.55 }}>
                  Valor de referencia. El alcance y el precio definitivo se confirman
                  tras revisar su caso. Sin costo por cotizar.
                </div>
              </div>

              <a href={wa} target="_blank" rel="noopener noreferrer"
                style={{
                  display: "block", background: "#25D366", color: "#fff",
                  padding: "15px", borderRadius: 8, textAlign: "center",
                  fontSize: 15.5, fontWeight: 700, textDecoration: "none",
                  marginBottom: 10,
                }}>
                Solicitar cotización por WhatsApp
              </a>

              <p style={{ fontSize: 12.5, color: C.grisClaro, textAlign: "center", margin: 0 }}>
                Le responde un ingeniero, no un contestador automático
              </p>

              {/* Suscripción */}
              {cot.incluyeSuscripcion && (
                <div style={{
                  marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.hueso}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                                gap: 10, alignItems: "baseline", marginBottom: 6 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: C.tinta }}>
                      {SUSCRIPCION.nombre}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.verde, whiteSpace: "nowrap" }}>
                      {$(SUSCRIPCION.desde)}<span style={{ fontSize: 12, fontWeight: 400 }}>/mes</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: C.gris, lineHeight: 1.55, margin: 0 }}>
                    {SUSCRIPCION.descripcion}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ══ Leyenda ══ */}
      <div style={{ background: C.hueso, borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.gris, marginBottom: 10 }}>
          Cómo leer estos resultados
        </div>
        <div style={{ display: "grid", gap: 7 }}>
          {(Object.keys(NATURALEZA_META) as Array<keyof typeof NATURALEZA_META>)
            .filter((k) => obligaciones.some((o) => o.naturaleza === k))
            .map((k) => (
              <div key={k} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5 }}>
                <span style={{
                  background: NATURALEZA_META[k].fondo, color: NATURALEZA_META[k].color,
                  padding: "2px 9px", borderRadius: 4, fontWeight: 700, fontSize: 11,
                  whiteSpace: "nowrap",
                }}>
                  {NATURALEZA_META[k].etiqueta}
                </span>
                <span style={{ color: C.gris }}>
                  {k === "obligacion_verificada" && "Exigible, con norma y artículo identificados"}
                  {k === "requisito_potencial" && "Puede aplicar según condiciones adicionales"}
                  {k === "recomendacion_tecnica" && "Recomendable, no exigible por norma"}
                  {k === "buena_practica" && "Mejora voluntaria"}
                  {k === "requiere_verificacion" && "Sin información suficiente para concluir"}
                  {k === "informacion_declarada" && "Proviene solo de lo que usted indicó"}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* ══ Posconsumo, solo para generación baja ══ */}
      {p.generaRespel && cat.exentoRegistro && cat.categoria === "exento" && (
        <div style={{ background: C.verdeFondo, border: "1px solid #CBE0D3", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: C.verde, marginBottom: 6 }}>
            Programas posconsumo
          </div>
          <p style={{ fontSize: 13.5, color: C.gris, lineHeight: 1.6, margin: "0 0 12px" }}>
            Estos programas reciben sin costo determinados residuos:
          </p>
          <div style={{ display: "grid", gap: 6 }}>
            {POSCONSUMO.map((x) => (
              <div key={x.nombre} style={{ fontSize: 13, color: C.tinta }}>
                <strong>{x.nombre}</strong>
                <span style={{ color: C.gris }}> — {x.recibe}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#8A9188", marginTop: 10, marginBottom: 0 }}>
            Verifique los puntos de recolección vigentes con cada programa.
          </p>
        </div>
      )}

      <p style={{ fontSize: 12, color: "#8A9188", lineHeight: 1.6, textAlign: "center", margin: "6px 0 0" }}>
        Este resultado es orientativo y se basa en la información que usted suministró.
        No constituye concepto técnico ni certifica el cumplimiento normativo de su
        establecimiento ante la autoridad ambiental.
      </p>
    </div>
  );
}

/* ── Bloque de obligaciones ─────────────────────────────── */
function Bloque({
  titulo, acciones, abierta, setAbierta,
}: {
  titulo: string; acciones: Obligacion[];
  abierta: string | null; setAbierta: (v: string | null) => void;
}) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.linea}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: C.hueso, padding: "13px 20px", borderBottom: `1px solid ${C.linea}` }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: C.tinta }}>
          {titulo}
          <span style={{ fontWeight: 400, color: C.gris, marginLeft: 8, fontSize: 13 }}>
            · {acciones.length}
          </span>
        </div>
      </div>

      {acciones.map((o) => {
        const open = abierta === o.id;
        const meta = NATURALEZA_META[o.naturaleza];
        return (
          <div key={o.id} style={{ borderBottom: `1px solid ${C.hueso}` }}>
            <button
              onClick={() => setAbierta(open ? null : o.id)}
              style={{
                width: "100%", background: "none", border: "none", cursor: "pointer",
                padding: "14px 20px", textAlign: "left", fontFamily: "inherit",
                display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
                borderLeft: `3px solid ${meta.color}`,
              }}
            >
              <div style={{ flex: 1 }}>
                <span style={{
                  display: "inline-block", background: meta.fondo, color: meta.color,
                  padding: "2px 9px", borderRadius: 4, fontSize: 10.5, fontWeight: 700,
                  marginBottom: 6, letterSpacing: ".3px",
                }}>
                  {meta.etiqueta}
                </span>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: C.tinta, lineHeight: 1.4 }}>
                  {o.titulo}
                </div>
                {o.fuente && (
                  <div style={{ fontSize: 12, color: C.gris, marginTop: 4 }}>
                    {o.fuente.norma} · {o.fuente.articulo}
                  </div>
                )}
                {o.plazo && (
                  <div style={{ fontSize: 12, color: meta.color, marginTop: 3, fontWeight: 600 }}>
                    {o.plazo}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: 18, color: C.gris, lineHeight: 1,
                transform: open ? "rotate(45deg)" : "none", transition: "transform .2s",
              }}>+</span>
            </button>

            {open && (
              <div style={{ padding: "0 20px 16px 23px" }}>

                {o.advertencia && (
                  <div style={{
                    background: meta.fondo, borderRadius: 6, padding: "10px 12px",
                    fontSize: 12.5, color: meta.color, lineHeight: 1.55, marginBottom: 12,
                  }}>
                    {o.advertencia}
                  </div>
                )}

                <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 5 }}>
                  Qué hacer
                </div>
                <ol style={{ fontSize: 13.5, color: C.gris, lineHeight: 1.75, margin: "0 0 12px", paddingLeft: 18 }}>
                  {o.acciones.map((s, i) => <li key={i}>{s}</li>)}
                </ol>

                <div style={{ fontSize: 12, fontWeight: 700, color: C.gris, marginBottom: 5 }}>
                  Qué debe conservar como evidencia
                </div>
                <ul style={{ fontSize: 13.5, color: C.gris, lineHeight: 1.75, margin: "0 0 12px", paddingLeft: 18 }}>
                  {o.evidencias.map((s, i) => <li key={i}>{s}</li>)}
                </ul>

                <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 12.5, color: C.gris, marginBottom: 10 }}>
                  <div><strong>Frecuencia:</strong> {o.frecuencia}</div>
                  {o.costo && <div><strong>Costo:</strong> {o.costo.valor}</div>}
                </div>

                {o.fuente ? (
                  <div style={{
                    fontSize: 11.5, color: "#8A9188", lineHeight: 1.6,
                    paddingTop: 10, borderTop: `1px solid ${C.hueso}`,
                  }}>
                    <strong>{o.fuente.norma}</strong> · {o.fuente.articulo}<br />
                    {o.fuente.entidad}<br />
                    Consultado en {o.fuente.fuenteConsultada} · verificado el{" "}
                    {o.fuente.fechaVerificacion} · fuente nivel {o.fuente.nivelFuente} ·
                    confianza {o.fuente.confianza}
                  </div>
                ) : (
                  <div style={{
                    fontSize: 11.5, color: C.morado, lineHeight: 1.6,
                    paddingTop: 10, borderTop: `1px solid ${C.hueso}`,
                  }}>
                    Sin fuente normativa verificada. Requiere confirmación profesional.
                  </div>
                )}

                {o.guia && (
                  <a href={o.guia} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "inline-block", marginTop: 10, fontSize: 13,
                      fontWeight: 700, color: C.verde, textDecoration: "none",
                    }}>
                    Descargar la guía completa →
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
