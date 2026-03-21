import { useRef, useState, useEffect } from 'react';

export default function SigPad({ onCapture, existing, readOnly, t }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const [has, setHas] = useState(!!existing);

  useEffect(() => {
    if (existing && ref.current) {
      const i = new Image();
      i.onload = () => ref.current.getContext('2d').drawImage(i, 0, 0);
      i.src = existing;
      setHas(true);
    }
  }, [existing]);

  const xy = (e, c) => {
    const r = c.getBoundingClientRect();
    const sx = c.width / r.width;
    const sy = c.height / r.height;
    const s = e.touches ? e.touches[0] : e;
    return { x: (s.clientX - r.left) * sx, y: (s.clientY - r.top) * sy };
  };

  const start = (e) => {
    if (readOnly) return;
    e.preventDefault();
    drawing.current = true;
    const c = ref.current;
    const ctx = c.getContext('2d');
    const p = xy(e, c);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e) => {
    if (!drawing.current || readOnly) return;
    e.preventDefault();
    const c = ref.current;
    const ctx = c.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a202c';
    const p = xy(e, c);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHas(true);
  };

  const end = () => { drawing.current = false; };

  const clear = () => {
    ref.current.getContext('2d').clearRect(0, 0, ref.current.width, ref.current.height);
    setHas(false);
    onCapture(null);
  };

  const save = () => {
    if (!has) return;
    onCapture(ref.current.toDataURL());
  };

  return (
    <div>
      <div className="sig-wrap">
        <canvas
          ref={ref}
          width={380}
          height={130}
          className="sig-canvas"
          style={{ maxWidth: '100%' }}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
      {!readOnly && (
        <div className="fc gap8 mt8">
          <button className="btn btn-bd btn-sm" onClick={clear}>{t.consent.clear}</button>
          <button className="btn btn-ok btn-sm" onClick={save}>{t.consent.save}</button>
          {has && <span className="save-flash">&#10003; {t.consent.saved}</span>}
        </div>
      )}
    </div>
  );
}
