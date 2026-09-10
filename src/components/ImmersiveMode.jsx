import React, { useRef, useEffect, useState } from 'react';

export default function ImmersiveMode({ active, onClose, warRoomMode }) {
  const canvasRef = useRef(null);
  const [speed, setSpeed] = useState(1);
  const [density, setDensity] = useState(120);
  const [connectivity, setConnectivity] = useState(80);
  const [theme, setTheme] = useState(warRoomMode ? 'red' : 'cyan'); // cyan | red | gold
  const [hoveredNode, setHoveredNode] = useState(null);

  // Sync theme with war room mode
  useEffect(() => {
    setTheme(warRoomMode ? 'red' : 'cyan');
  }, [warRoomMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initial 3D nodes
    const nodeNames = [
      'Finance Node', 'Stripe Payments', 'Salesforce CRM', 'SAP Core', 'Ingestion Bridge', 
      'Risk Engine', 'Fraud Scanner', 'Collinearity Scan', 'Logistics Fleet', 'Port Delays',
      'AMER Regional', 'APAC Regional', 'EMEA Regional', 'LTV Core', 'Churn Watcher', 
      'Support Tickets', 'Audit Ledger', 'Neural Forecast', 'Anomaly Detector', 'Executive Brief'
    ];

    const particles = [];
    for (let i = 0; i < density; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 180 + Math.random() * 80;
      
      particles.push({
        x3d: r * Math.sin(phi) * Math.cos(theta),
        y3d: r * Math.sin(phi) * Math.sin(theta),
        z3d: r * Math.cos(phi),
        name: i < nodeNames.length ? nodeNames[i] : null,
        val: Math.round(50 + Math.random() * 50),
        pulseOffset: Math.random() * 10
      });
    }

    let angleY = 0.002;
    let angleX = 0.001;
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseDown = (e) => {
      isMouseDown = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (!isMouseDown) {
        // Hover detection
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        
        let found = null;
        for (let p of particles) {
          if (p.screenX && p.screenY && p.name) {
            const dx = p.screenX - mx;
            const dy = p.screenY - my;
            if (dx * dx + dy * dy < 80) {
              found = p;
              break;
            }
          }
        }
        setHoveredNode(found);
        return;
      }
      const dx = e.clientX - mouseX;
      const dy = e.clientY - mouseY;
      angleY += dx * 0.0001;
      angleX += dy * 0.0001;
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let frameId;
    const bpm = warRoomMode ? 124 : 72;
    const pulseFrequency = (bpm / 60) * 1000; // time in ms for one beat

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      // Stars backdrop
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // Color maps
      const colors = {
        cyan: { core: '#06B6D4', line: 'rgba(6, 182, 212, 0.08)', lineHover: 'rgba(6, 182, 212, 0.4)', text: '#22D3EE' },
        red: { core: '#EF4444', line: 'rgba(239, 68, 68, 0.09)', lineHover: 'rgba(239, 68, 68, 0.4)', text: '#F87171' },
        gold: { core: '#F59E0B', line: 'rgba(245, 158, 11, 0.08)', lineHover: 'rgba(245, 158, 11, 0.4)', text: '#FBBF24' }
      };

      const themeColors = colors[theme] || colors.cyan;

      // Pulse multiplier
      const pulseTime = Date.now() % pulseFrequency;
      const pulseProgress = Math.sin((pulseTime / pulseFrequency) * Math.PI);
      const globalScale = 1.0 + pulseProgress * 0.03;

      // Rotate coordinates
      const cosY = Math.cos(angleY * speed);
      const sinY = Math.sin(angleY * speed);
      const cosX = Math.cos(angleX * speed);
      const sinX = Math.sin(angleX * speed);

      particles.forEach((p) => {
        // Y rotate
        let x1 = p.x3d * cosY - p.z3d * sinY;
        let z1 = p.z3d * cosY + p.x3d * sinY;
        // X rotate
        let y2 = p.y3d * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y3d * sinX;

        p.rotX = x1;
        p.rotY = y2;
        p.rotZ = z2;

        // Perspective projection
        const fov = 380;
        const scale = fov / (fov + z2);
        p.screenX = w / 2 + x1 * scale * globalScale;
        p.screenY = h / 2 + y2 * scale * globalScale;
        p.screenScale = scale;
      });

      // Draw connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const pi = particles[i];
          const pj = particles[j];
          
          const dx = pi.rotX - pj.rotX;
          const dy = pi.rotY - pj.rotY;
          const dz = pi.rotZ - pj.rotZ;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (dist < connectivity * 2.5) {
            const opacity = (1 - dist / (connectivity * 2.5)) * 0.25;
            ctx.strokeStyle = (pi === hoveredNode || pj === hoveredNode) 
              ? themeColors.lineHover 
              : themeColors.line.replace('0.08', opacity.toFixed(2));
            ctx.lineWidth = (pi === hoveredNode || pj === hoveredNode) ? 1.2 : 0.5;
            ctx.beginPath();
            ctx.moveTo(pi.screenX, pi.screenY);
            ctx.lineTo(pj.screenX, pj.screenY);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      particles.forEach((p) => {
        const rad = (p.name ? 5.5 : 2) * p.screenScale;
        if (rad < 0.2) return;

        // Radial gradients for glow
        const grad = ctx.createRadialGradient(p.screenX, p.screenY, 0, p.screenX, p.screenY, rad * 2.5);
        grad.addColorStop(0, themeColors.core);
        grad.addColorStop(0.3, themeColors.core + '80');
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.screenX, p.screenY, rad * 3, 0, Math.PI * 2);
        ctx.fill();

        // Node outline
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(p.screenX, p.screenY, rad * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Node labels
        if (p.name && p.screenScale > 0.7) {
          ctx.fillStyle = p === hoveredNode ? '#FFFFFF' : themeColors.text;
          ctx.font = `600 ${Math.max(9, Math.round(9.5 * p.screenScale))}px 'Inter', sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(p.name, p.screenX, p.screenY - rad * 2);
        }
      });

      // Ambient text rings
      ctx.strokeStyle = warRoomMode ? 'rgba(239, 68, 68, 0.05)' : 'rgba(56, 189, 248, 0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 240, 0, Math.PI * 2);
      ctx.stroke();

      frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [speed, density, connectivity, theme, warRoomMode]);

  return (
    <div className="immersive-overlay">
      <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />

      {/* Futuristic overlay UI controls */}
      <div className="immersive-controls">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '1px', color: '#FFF' }}>CORTEX OMEGA 3D</span>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.4 }}>
          Live 3D topology of the enterprise infrastructure. Scrub and rotate spatial nodes to audit real-time relationship coordinates.
        </div>

        {/* Node Hover Tooltip Card */}
        <div style={{ minHeight: 70, border: '1px dashed #334155', borderRadius: 6, padding: 10, background: 'rgba(15,23,42,0.6)' }}>
          {hoveredNode ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#38BDF8', textTransform: 'uppercase' }}>{hoveredNode.name}</div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
                Status: <span style={{ color: '#34D399', fontWeight: 600 }}>Active Ingestion</span>
              </div>
              <div style={{ fontSize: 10, color: '#94A3B8' }}>
                Operational Health: <span style={{ color: '#FFF', fontWeight: 600 }}>{hoveredNode.val}%</span>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 10, color: '#64748B', display: 'flex', alignItems: 'center', height: 50, justifyContent: 'center' }}>
              Hover over a node to inspect system metrics
            </div>
          )}
        </div>

        {/* Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>
              <span>ORBIT ROTATION SPEED</span>
              <span style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{speed.toFixed(1)}x</span>
            </div>
            <input type="range" min="0" max="3" step="0.1" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: '#38BDF8' }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>
              <span>NEURAL PATH THRESHOLD</span>
              <span style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{connectivity}px</span>
            </div>
            <input type="range" min="30" max="150" step="5" value={connectivity} onChange={(e) => setConnectivity(Number(e.target.value))} style={{ width: '100%', accentColor: '#38BDF8' }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>
              <span>PARTICLE DENSITY</span>
              <span style={{ fontFamily: 'monospace', color: '#38BDF8' }}>{density} nodes</span>
            </div>
            <input type="range" min="40" max="200" step="10" value={density} onChange={(e) => setDensity(Number(e.target.value))} style={{ width: '100%', accentColor: '#38BDF8' }} />
          </div>
        </div>

        {/* Color Palette Switcher */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>COLOR SCHEME MODEL</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['cyan', 'red', 'gold'].map((c) => (
              <button
                key={c}
                onClick={() => setTheme(c)}
                style={{
                  flex: 1,
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '4px 0',
                  borderRadius: 4,
                  border: theme === c ? '1px solid #FFF' : '1px solid #1E293B',
                  background: c === 'cyan' ? '#0891B2' : c === 'red' ? '#B91C1C' : '#D97706',
                  color: '#FFF',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                {c === 'cyan' ? 'Hologram' : c === 'red' ? 'Threat' : 'Wealth'}
              </button>
            ))}
          </div>
        </div>

        <button className="hologram-btn" onClick={onClose} style={{ marginTop: 10 }}>
          RETURN TO NORMAL VIEW
        </button>
      </div>

      {/* Decorative scanline overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
        backgroundSize: '100% 4px, 6px 100%'
      }} />
    </div>
  );
}
