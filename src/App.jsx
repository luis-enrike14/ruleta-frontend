import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import './App.css';

// ⚠️ Tu número de WhatsApp real con clave de país
const TELEFONO_WHATSAPP = "526471063084";

// 🌐 URL de tu backend desplegado en Render
const API_BASE_URL = "https://ruleta-backend-drpn.onrender.com";

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const esModoAdminURL = urlParams.get('admin') === 'true' || urlParams.get('admin') === '1';

  const [vista, setVista] = useState(esModoAdminURL ? 'admin' : 'ruleta');
  const [secciones, setSecciones] = useState([]);
  const [codigo, setCodigo] = useState('');
  const [girando, setGirando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [infoPremio, setInfoPremio] = useState(null);
  const [mensajeEnviado, setMensajeEnviado] = useState(false);
  const [bloquearGiro, setBloquearGiro] = useState(false);
  const [textoBoton, setTextoBoton] = useState('¡GIRAR RULETA!');

  const canvasRef = useRef(null);
  const anguloActualRef = useRef(0);

  // Estados Admin
  const [folios, setFolios] = useState([]);
  const [nuevosFoliosInput, setNuevosFoliosInput] = useState('');
  const [mensajeAdmin, setMensajeAdmin] = useState(null);

  // Referencia exclusiva para la tarjeta publicitaria de ganadores
  const reporteGanadoresRef = useRef(null);

  // Dibujar la ruleta
  const dibujarRuleta = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centroX = width / 2;
    const centroY = height / 2;
    const radio = Math.min(centroX, centroY) - 15;

    const totalPremios = secciones.length;
    if (totalPremios === 0) return;

    const anguloPorGajo = (2 * Math.PI) / totalPremios;
    const anguloActual = anguloActualRef.current;

    ctx.clearRect(0, 0, width, height);

    // Marco dorado
    ctx.save();
    ctx.beginPath();
    ctx.arc(centroX, centroY, radio + 10, 0, 2 * Math.PI);
    const gradienteMarco = ctx.createRadialGradient(
      centroX, centroY, radio - 5,
      centroX, centroY, radio + 12
    );
    gradienteMarco.addColorStop(0, '#785210');
    gradienteMarco.addColorStop(0.3, '#ffd700');
    gradienteMarco.addColorStop(0.5, '#fff5b2');
    gradienteMarco.addColorStop(0.8, '#d4af37');
    gradienteMarco.addColorStop(1, '#3a2606');
    ctx.fillStyle = gradienteMarco;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.restore();

    // Gajitos
    const coloresLujo = [
      { base: '#8b0000', luz: '#ff4d4d', sombra: '#4a0000' },
      { base: '#0f172a', luz: '#334155', sombra: '#020617' },
      { base: '#b8860b', luz: '#ffdf00', sombra: '#5c4000' },
      { base: '#064e3b', luz: '#10b981', sombra: '#022c22' },
    ];

    secciones.forEach((seccion, i) => {
      const anguloInicio = i * anguloPorGajo + anguloActual;
      const anguloFin = anguloInicio + anguloPorGajo;
      const colorCombo = coloresLujo[i % coloresLujo.length];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centroX, centroY);
      ctx.arc(centroX, centroY, radio, anguloInicio, anguloFin);
      ctx.closePath();

      const xMedio = centroX + Math.cos(anguloInicio + anguloPorGajo / 2) * radio;
      const yMedio = centroY + Math.sin(anguloInicio + anguloPorGajo / 2) * radio;
      const gradGajo = ctx.createLinearGradient(centroX, centroY, xMedio, yMedio);
      gradGajo.addColorStop(0, colorCombo.sombra);
      gradGajo.addColorStop(0.5, colorCombo.base);
      gradGajo.addColorStop(1, colorCombo.luz);

      ctx.fillStyle = gradGajo;
      ctx.fill();

      ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(centroX, centroY);
      ctx.rotate(anguloInicio + anguloPorGajo / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';

      const textoPremio = typeof seccion === 'object' && seccion !== null
        ? (seccion.texto || seccion.nombre || seccion.premio || JSON.stringify(seccion))
        : String(seccion);

      const tamanoFuente = textoPremio.length > 12 ? 'bold 11px' : 'bold 14px';
      ctx.font = `${tamanoFuente} "Segoe UI", sans-serif`;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(textoPremio, radio - 15, 4);
      ctx.restore();
    });

    // Pernos
    for (let i = 0; i < totalPremios; i++) {
      const anguloPin = i * anguloPorGajo + anguloActual;
      const pinX = centroX + Math.cos(anguloPin) * (radio + 3);
      const pinY = centroY + Math.sin(anguloPin) * (radio + 3);

      ctx.save();
      ctx.beginPath();
      ctx.arc(pinX, pinY, 4, 0, 2 * Math.PI);
      const gradPin = ctx.createRadialGradient(pinX - 1, pinY - 1, 1, pinX, pinY, 4);
      gradPin.addColorStop(0, '#ffffff');
      gradPin.addColorStop(0.5, '#ffd700');
      gradPin.addColorStop(1, '#5c4000');
      ctx.fillStyle = gradPin;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 3;
      ctx.fill();
      ctx.restore();
    }

    // Centro
    ctx.save();
    ctx.beginPath();
    ctx.arc(centroX, centroY, 32, 0, 2 * Math.PI);
    const gradCentroEx = ctx.createRadialGradient(centroX, centroY, 10, centroX, centroY, 32);
    gradCentroEx.addColorStop(0, '#fff5b2');
    gradCentroEx.addColorStop(0.5, '#d4af37');
    gradCentroEx.addColorStop(1, '#2a1a04');
    ctx.fillStyle = gradCentroEx;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 10;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centroX, centroY, 18, 0, 2 * Math.PI);
    const gradCentroIn = ctx.createRadialGradient(centroX - 3, centroY - 3, 2, centroX, centroY, 18);
    gradCentroIn.addColorStop(0, '#ffd700');
    gradCentroIn.addColorStop(0.7, '#8b6508');
    gradCentroIn.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradCentroIn;
    ctx.fill();
    ctx.restore();
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/ruleta-config`)
      .then((res) => res.json())
      .then((data) => setSecciones(data.secciones || []))
      .catch((err) => console.error("Error al cargar la ruleta:", err));
  }, []);

  useEffect(() => {
    if (vista === 'ruleta' && secciones.length > 0) {
      dibujarRuleta();
    }
  }, [secciones, vista]);

  const cargarFoliosAdmin = () => {
    fetch(`${API_BASE_URL}/api/admin/folios`)
      .then((res) => res.json())
      .then((data) => setFolios(data.folios || []))
      .catch((err) => console.error("Error al cargar folios:", err));
  };

  useEffect(() => {
    if (vista === 'admin') {
      cargarFoliosAdmin();
    }
  }, [vista]);

  const manejarGiro = async () => {
    if (!codigo.trim() || girando || bloquearGiro) return;

    // 🔊 1. Crear el sonido de ruleta en bucle (Loop) tipo casino
    const audioGiro = new Audio("https://assets.mixkit.co/active_storage/sfx/1613/1613-preview.mp3");
    audioGiro.loop = true; // Se repite continuamente mientras gira
    audioGiro.play().catch(e => console.log("Audio de giro bloqueado por navegador", e));



    setGirando(true);
    setMensaje(null);
    setInfoPremio(null);
    setMensajeEnviado(false);
    setTextoBoton('GIRANDO...');

    let animacionActiva = true;
    const girarLibremente = () => {
      if (!animacionActiva) return;
      anguloActualRef.current += 0.15;
      dibujarRuleta();
      requestAnimationFrame(girarLibremente);
    };
    requestAnimationFrame(girarLibremente);

    try {
      const res = await fetch(`${API_BASE_URL}/api/girar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo })
      });

      const data = await res.json();

      if (!res.ok) {
        animacionActiva = false;
        setMensaje({ tipo: 'error', texto: data.error });
        setGirando(false);
        setBloquearGiro(true);
        setTextoBoton('FOLIO NO VÁLIDO / USADO');
        return;
      }

      animacionActiva = false;

      const indexPremio = data.indiceGanador;
      const numSectores = secciones.length;
      const arcoPorSector = (2 * Math.PI) / numSectores;

      const anguloCentroGajo = indexPremio * arcoPorSector + arcoPorSector / 2;
      const objetivoRestante = (3 * Math.PI / 2 - anguloCentroGajo) % (2 * Math.PI);

      const vueltasExtra = 6 * 2 * Math.PI;
      const anguloActualNormalizado = anguloActualRef.current % (2 * Math.PI);

      let deltaAngulo = objetivoRestante - anguloActualNormalizado;
      if (deltaAngulo < 0) deltaAngulo += 2 * Math.PI;

      const anguloInicioFrenado = anguloActualRef.current;
      const anguloTotalFinal = anguloInicioFrenado + vueltasExtra + deltaAngulo;

      let inicioFrenadoTime = null;
      const duracionFrenado = 8000;

      const frenarRuleta = (tiempo) => {
        if (!inicioFrenadoTime) inicioFrenadoTime = tiempo;
        let progreso = (tiempo - inicioFrenadoTime) / duracionFrenado;
        if (progreso > 1) progreso = 1;

        // 🛑 TRUCO DE PREVENCIÓN: Si el frenado llega al 90%, cortamos el sonido
        // un instante antes para compensar el retraso del navegador.
        if (progreso >= 0.70 && !window.audioDetenido) {
          window.audioDetenido = true;
          audioGiro.pause();
          audioGiro.currentTime = 0;
        }

        let easeProgreso = 1 - Math.pow(1 - progreso, 3);
        anguloActualRef.current = anguloInicioFrenado + (anguloTotalFinal - anguloInicioFrenado) * easeProgreso;

        dibujarRuleta();

        if (progreso < 1) {
          requestAnimationFrame(frenarRuleta);
        } else {
          // 🛑 LA RULETA SE DETUVO POR COMPLETO: Detenemos el sonido de giro
          audioGiro.pause();
          audioGiro.currentTime = 0;

          anguloActualRef.current = anguloTotalFinal;
          dibujarRuleta();
          setGirando(false);

          if (!data.esUltimoGiro) {
            setTextoBoton('🎰 ¡GIRAR DE NUEVO!');
            setMensaje({
              tipo: 'exito',
              texto: data.mensaje ? data.mensaje.replace(/tirar de nuevo/gi, 'girar de nuevo') : "¡Presiona el botón para girar de nuevo!"
            });
          } else {
            setMensaje({
              tipo: data.resultado.esPremio ? 'exito' : 'error',
              texto: data.mensaje
            });

            if (data.resultado.esPremio) {
              setBloquearGiro(true);
              setTextoBoton('¡PREMIO OBTENIDO!');

              confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
              // 🔊 2. Reproducir sonido de victoria junto con el confeti
              try {
                const audioGanador = new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3");
                audioGanador.volume = 0.7;
                audioGanador.play().catch(e => console.log("Audio de ganador bloqueado por navegador", e));
              } catch (err) {}

              setInfoPremio({
                codigo: codigo.trim().toUpperCase(),
                premio: data.resultado.premio,
                fechaHora: data.fechaUso || new Date().toLocaleString()
              });
            } else {
              setBloquearGiro(true);
              setTextoBoton('FOLIO YA UTILIZADO');
            }
          }
        }
      };

      requestAnimationFrame(frenarRuleta);

    } catch (error) {
      animacionActiva = false;
      audioGiro.pause(); // Detener sonido si ocurre error de red
      setMensaje({ tipo: 'error', texto: "Error al conectar con el servidor." });
      setGirando(false);
      setTextoBoton('¡GIRAR RULETA!');
    }
  };

  const abrirWhatsApp = () => {
    if (!infoPremio || mensajeEnviado) return;

    setMensajeEnviado(true);

    const textoMensaje = `¡Hola! Quiero reclamar el premio de mi folio en la Ruleta de la Suerte\n\n` +
      `*Folio:* ${infoPremio.codigo}\n` +
      `*Fecha y hora:* ${infoPremio.fechaHora}\n\n` +
      `Quedo a la espera de la verificación de mi folio, ¡gracias!`;

    const url = `https://wa.me/${TELEFONO_WHATSAPP}?text=${encodeURIComponent(textoMensaje)}`;
    window.open(url, '_blank');
  };

  const generar100Aleatorios = async () => {
    if (!window.confirm("⚠️ ¿Generar lote de 100 códigos nuevos? Se reemplazarán los anteriores.")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/generar-aleatorios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setMensajeAdmin(`¡Éxito! Se generaron 100 códigos. Procede a asignar premios y giros extra.`);
        cargarFoliosAdmin();
      } else {
        setMensajeAdmin(data.error || 'Error al generar.');
      }
    } catch (err) {
      setMensajeAdmin('Error de conexión.');
    }
  };

  const asignarPremios = async () => {
    if (!window.confirm("🎲 ¿Repartir aleatoriamente los 33 premios entre los códigos actuales?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/asignar-premios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setMensajeAdmin(`¡Premios distribuidos correctamente!`);
        cargarFoliosAdmin();
      } else {
        setMensajeAdmin(data.error || 'Error al asignar premios.');
      }
    } catch (err) {
      setMensajeAdmin('Error de conexión.');
    }
  };

  const asignarGirosExtra = async () => {
    if (!window.confirm("🎰 ¿Repartir aleatoriamente 50 giros extra entre los códigos actuales?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/asignar-giros-extra`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setMensajeAdmin(data.mensaje);
        cargarFoliosAdmin();
      } else {
        setMensajeAdmin(data.error || 'Error al asignar giros extra.');
      }
    } catch (err) {
      setMensajeAdmin('Error de conexión.');
    }
  };

  const descargarImagenGanadores = () => {
    if (reporteGanadoresRef.current === null) return;

    toPng(reporteGanadoresRef.current, { cacheBust: true, backgroundColor: '#0f172a' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `reporte-ganadores-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Error al generar la imagen de ganadores:', err);
      });
  };

  const eliminarFolio = async (id, codigo) => {
    if (!window.confirm(`¿Estás seguro de eliminar el folio ${codigo}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/folios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMensajeAdmin(`Folio ${codigo} eliminado.`);
        cargarFoliosAdmin();
      }
    } catch (err) {
      setMensajeAdmin('Error de conexión.');
    }
  };

  const eliminarTodosLosFolios = async () => {
    if (!window.confirm("⚠️ ¿Eliminar TODOS los folios?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/folios-todos`, { method: 'DELETE' });
      if (res.ok) {
        setMensajeAdmin('Se han eliminado todos los folios.');
        cargarFoliosAdmin();
      }
    } catch (err) {
      setMensajeAdmin('Error de conexión.');
    }
  };

  const foliosGanadoresOficiales = folios.filter(
    (f) => f.usado && f.premio_ganado && f.premio_ganado !== 'Suerte para la próxima' && f.premio_ganado !== '-'
  );

  return (
    <div className="ruleta-container">
      {esModoAdminURL && (
        <div className="nav-tabs" style={{ marginBottom: '25px' }}>
          <button className={`tab-btn ${vista === 'ruleta' ? 'activo' : ''}`} onClick={() => setVista('ruleta')} style={{ marginRight: '10px', padding: '10px 20px', cursor: 'pointer' }}>🎰 Vista Ruleta</button>
          <button className={`tab-btn ${vista === 'admin' ? 'activo' : ''}`} onClick={() => setVista('admin')} style={{ padding: '10px 20px', cursor: 'pointer' }}>⚙️ Panel Admin</button>
        </div>
      )}

      {vista === 'ruleta' ? (
        <>
          <h2>Ruleta de la Suerte</h2>
          <div className="ruleta-wrapper">
            <div className="indicador"></div>
            <canvas ref={canvasRef} width={400} height={400} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          </div>

          <div className="panel-control">
            <input
              type="text"
              className="input-folio"
              placeholder="INGRESA TU FOLIO"
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value);
                setBloquearGiro(false);
                setInfoPremio(null);
                setMensajeEnviado(false);
                setMensaje(null);
                setTextoBoton('¡GIRAR RULETA!');
              }}
              disabled={girando || (Boolean(infoPremio) && !mensajeEnviado)}
            />
            <button className="btn-girar" onClick={manejarGiro} disabled={girando || !codigo.trim() || bloquearGiro}>
              {textoBoton}
            </button>
          </div>

          {mensaje && (
            <div className={`mensaje-resultado ${mensaje.tipo}`} style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              {mensaje.texto}
            </div>
          )}

          {infoPremio && (
            <button
              onClick={abrirWhatsApp}
              disabled={mensajeEnviado}
              className="btn-palpitante"
              style={{
                marginTop: '15px',
                width: '100%',
                maxWidth: '300px',
                padding: '14px 20px',
                backgroundColor: mensajeEnviado ? '#64748b' : '#25D366',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: mensajeEnviado ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: mensajeEnviado ? 'none' : '0 4px 15px rgba(37, 211, 102, 0.4)',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
            >
              {mensajeEnviado ? '✓ Reclamo enviado' : '¡RECLAMAR PREMIO!'}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </button>
          )}
        </>
      ) : (
        <div className="panel-admin" style={{ color: '#ffffff', backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2>Panel de Administración</h2>

          <div className="seccion-crear" style={{ marginBottom: '20px', padding: '15px', background: '#1e293b', borderRadius: '8px' }}>
            <h3>🎲 Paso 1: Generar 100 Códigos</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Crea el lote de 100 códigos vacíos para el sorteo de forma instantánea.</p>
            <button onClick={generar100Aleatorios} style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}>Generar 100 Códigos</button>
          </div>

          <div className="seccion-crear" style={{ marginBottom: '20px', padding: '15px', background: '#1e293b', borderRadius: '8px' }}>
            <h3>🎁 Paso 2: Asignar Premios Aleatorios</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Reparte los 33 premios (1 de $300, 1 de $150, 1 de $100, 4 de $50, 25 de $20) de forma aleatoria.</p>
            <button onClick={asignarPremios} style={{ padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}>Asignar Premios</button>
          </div>

          <div className="seccion-crear" style={{ marginBottom: '20px', padding: '15px', background: '#1e293b', borderRadius: '8px' }}>
            <h3>🎰 Paso 3: Asignar Giros Extra (Opcional)</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Reparte aleatoriamente 50 giros extras entre los folios.</p>
            <button onClick={asignarGirosExtra} style={{ padding: '10px 20px', background: '#d97706', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}>Asignar 50 Giros Extras</button>
          </div>

          {mensajeAdmin && <div className="caja-mensaje-admin" style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981', marginBottom: '15px', borderRadius: '6px' }}>{mensajeAdmin}</div>}

          <hr style={{ borderColor: '#334155' }} />

          <div className="encabezado-tabla" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0' }}>
            <h3>Lista de Folios Registrados ({folios.length} / 100)</h3>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={descargarImagenGanadores}
                style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '6px', fontWeight: 'bold' }}
              >
                📸 Descargar Reporte de Ganadores
              </button>

              {folios.length > 0 && (
                <button className="btn-eliminar-todos" onClick={eliminarTodosLosFolios} style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '6px' }}>🗑️ Eliminar TODOS</button>
              )}
            </div>
          </div>

          {/* TABLA DE ADMINISTRACIÓN */}
          <div className="tabla-container" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '6px', backgroundColor: '#0f172a', padding: '5px' }}>
            <table className="tabla-folios" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#ffffff', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: '#cbd5e1', position: 'sticky', top: 0, zIndex: 1 }}>
                  <th style={{ padding: '10px' }}>#</th>
                  <th style={{ padding: '10px' }}>Folio</th>
                  <th style={{ padding: '10px' }}>Premio Preasignado</th>
                  <th style={{ padding: '10px' }}>Giros Extra</th>
                  <th style={{ padding: '10px' }}>Estatus</th>
                  <th style={{ padding: '10px' }}>Premio Obtenido</th>
                  <th style={{ padding: '10px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {folios.map((f, index) => {
                const esGanador = f.premio_asignado && f.premio_asignado !== "Suerte para la próxima" && f.premio_asignado !== "Sin asignar";
                const numeroVisual = ((index + 1) % 100).toString().padStart(2, '0');
                return (
                  <tr key={f.id} style={{ borderBottom: '1px solid #334155', backgroundColor: f.usado ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }}>
                    <td style={{ padding: '10px', color: '#94a3b8' }}>{numeroVisual}</td>
                    <td style={{ padding: '10px' }}><strong style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '1rem' }}>{f.codigo}</strong></td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold',
                        backgroundColor: esGanador ? 'rgba(16, 185, 129, 0.2)' : '#334155',
                        color: esGanador ? '#34d399' : '#e2e8f0',
                        border: esGanador ? '1px solid #10b981' : '1px solid #475569'
                      }}>
                        {f.premio_asignado === 'Sin asignar' ? '⚠️ Sin asignar' : (esGanador ? `🎁 ${f.premio_asignado}` : '❌ Suerte')}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{ color: f.tipo_giro_extra > 0 ? '#fbbf24' : '#64748b', fontWeight: 'bold' }}>
                        {f.tipo_giro_extra > 0 ? `+${f.tipo_giro_extra} 🎰` : '-'}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ fontWeight: 'bold', color: f.usado ? '#f87171' : '#34d399' }}>
                        {f.usado ? '🔴 Utilizado' : '🟢 Disponible'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>{f.premio_ganado || '-'}</td>
                    <td style={{ padding: '10px' }}>
                      <button className="btn-eliminar-item" onClick={() => eliminarFolio(f.id, f.codigo)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }} title="Eliminar folio">❌</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MÓDULO ESPECIAL PUBLICITARIO */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div
            ref={reporteGanadoresRef}
            style={{
              width: '650px',
              padding: '30px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontFamily: '"Segoe UI", Roboto, sans-serif',
              borderRadius: '16px',
              border: '2px solid #d4af37',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <h2 style={{ color: '#ffd700', margin: '0 0 5px 0', fontSize: '1.8rem', letterSpacing: '1px' }}>
                🏆 REPORTE OFICIAL DE GANADORES 🏆
              </h2>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
                Sorteo y Ruleta de la Suerte
              </p>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#1e293b', color: '#ffd700', borderBottom: '2px solid #d4af37' }}>
                  <th style={{ padding: '12px', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '12px' }}>Folio</th>
                  <th style={{ padding: '12px' }}>Premio Obtenido</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Fecha y Hora</th>
                </tr>
              </thead>
              <tbody>
                {foliosGanadoresOficiales.length > 0 ? (
                  foliosGanadoresOficiales.map((f, index) => {
                    // Buscamos dentro de la lista principal de folios para extraer exactamente el número que le correspondía
                    const folioOriginal = folios.find(item => item.id === f.id || item.codigo === f.codigo);
                    const indiceOriginal = folioOriginal ? folios.indexOf(folioOriginal) : index;
                    const numeroRealGanador = ((indiceOriginal + 1) % 100).toString().padStart(2, '0');

                    return (
                      <tr key={f.id || index} style={{ borderBottom: '1px solid #334155', background: index % 2 === 0 ? 'rgba(30, 41, 59, 0.3)' : 'transparent' }}>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#ffd700', fontWeight: 'bold' }}>
                          {numeroRealGanador}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <strong style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                            {f.codigo}
                          </strong>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ color: '#34d399', fontWeight: 'bold', fontSize: '1rem' }}>
                            🎁 {f.premio_ganado}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#cbd5e1', fontSize: '0.85rem' }}>
                          {f.fecha_uso || new Date().toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                      Aún no hay ganadores registrados en este sorteo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ marginTop: '25px', textAlign: 'center', borderTop: '1px solid #334155', paddingTop: '15px' }}>
              <p style={{ color: '#fbbf24', margin: 0, fontWeight: 'bold', fontSize: '0.9rem' }}>
                ¡Felicidades a todos los ganadores! 🎉
              </p>
            </div>
          </div>
        </div>

      </div>
    )}
  </div>
);
}

export default App;          