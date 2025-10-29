import React, { useRef, useState, useEffect } from "react";
import "../index.css";

export default function PaintCanvas() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawing = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });

  const [color, setColor] = useState("#111827");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(600);

  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const maxHistory = 25;

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const data = canvasRef.current.toDataURL();
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
      saveState(true);
    };
    img.src = data;
  }, [bgColor]);

  function getPointerPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    return { x, y };
  }

  function pointerDown(e) {
    e.preventDefault();
    drawing.current = true;
    lastPoint.current = getPointerPos(e);
    const ctx = ctxRef.current;
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineWidth = size;
    ctx.strokeStyle = isEraser ? bgColor : color;
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
  }

  function pointerMove(e) {
    if (!drawing.current) return;
    const ctx = ctxRef.current;
    const p = getPointerPos(e);
    ctx.lineWidth = size;
    ctx.strokeStyle = isEraser ? bgColor : color;
    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPoint.current = p;
  }

  function pointerUp(e) {
    if (!drawing.current) return;
    const ctx = ctxRef.current;
    ctx.closePath();
    drawing.current = false;
    saveState();
    redoStack.current = [];
  }

  function saveState(init = false) {
    try {
      const data = canvasRef.current.toDataURL();
      if (init) {
        if (undoStack.current.length === 0) undoStack.current.push(data);
        return;
      }
      undoStack.current.push(data);
      if (undoStack.current.length > maxHistory) undoStack.current.shift();
    } catch (err) {
      console.error("Save state failed", err);
    }
  }

  function undo() {
    if (undoStack.current.length <= 1) return;
    const last = undoStack.current.pop();
    redoStack.current.push(last);
    const previous = undoStack.current[undoStack.current.length - 1];
    restoreFromDataURL(previous);
  }

  function redo() {
    if (redoStack.current.length === 0) return;
    const next = redoStack.current.pop();
    undoStack.current.push(next);
    restoreFromDataURL(next);
  }

  function restoreFromDataURL(dataURL) {
    const img = new Image();
    img.onload = () => {
      const ctx = ctxRef.current;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataURL;
  }

  function clearCanvas() {
    const ctx = ctxRef.current;
    ctx.fillStyle = bgColor;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    saveState();
    redoStack.current = [];
  }

  function downloadPNG() {
    const link = document.createElement("a");
    link.download = `painting-${new Date().toISOString()}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  function handleResize() {
    const temp = canvasRef.current.toDataURL();
    const img = new Image();
    img.onload = () => {
      const ctx = ctxRef.current;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(img, 0, 0);
      saveState();
    };
    img.src = temp;
  }

  return (
    <div className="paint-container">
      <h1 className="title">Canvas Paint, Brush & Sketch</h1>

      <div className="main-layout">
        <div className="canvas-section">
          <canvas
            ref={canvasRef}
            onMouseDown={pointerDown}
            onMouseMove={pointerMove}
            onMouseUp={pointerUp}
            onMouseLeave={pointerUp}
            onTouchStart={pointerDown}
            onTouchMove={pointerMove}
            onTouchEnd={pointerUp}
            style={{ backgroundColor: bgColor }}
          />
        </div>

        <div className="controls">
          <label>Brush Size: {size}px</label>
          <input type="range" min="1" max="80" value={size} onChange={(e) => setSize(Number(e.target.value))} />

          <label>Color:</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />

          <label>Background:</label>
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />

          <button onClick={() => setIsEraser(!isEraser)}>{isEraser ? "Eraser On" : "Eraser"}</button>
          <button onClick={undo}>Undo</button>
          <button onClick={redo}>Redo</button>
          <button onClick={clearCanvas}>Clear</button>
          <button onClick={downloadPNG}>Save</button>

          <label>Canvas Size</label>
          <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} />
          <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} />
          <button onClick={handleResize}>Apply</button>
        </div>
      </div>
    </div>
  );
}
