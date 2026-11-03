"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, ZoomIn, ZoomOut, RotateCw, Crop, Move } from "lucide-react";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedDataUrl: string) => void;
  title?: string;
  defaultAspect?: "pillar" | "square" | "free";
}

export default function ImageCropModal({
  isOpen,
  onClose,
  imageUrl,
  onCropComplete,
  title = "Crop Obstacle Image",
  defaultAspect = "pillar",
}: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [aspectRatio, setAspectRatio] = useState<"pillar" | "square" | "free">(defaultAspect);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load Image
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      // Reset view
      setScale(1.0);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      drawCropPreview();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Determine viewport dimensions based on aspect ratio
  const getCropDimensions = useCallback(() => {
    if (aspectRatio === "pillar") {
      return { width: 150, height: 400 }; // 1:2.67 ideal pillar ratio
    } else if (aspectRatio === "square") {
      return { width: 260, height: 260 };
    } else {
      return { width: 220, height: 350 };
    }
  }, [aspectRatio]);

  // Draw crop preview onto canvas
  const drawCropPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width: cropW, height: cropH } = getCropDimensions();
    canvas.width = cropW;
    canvas.height = cropH;

    ctx.clearRect(0, 0, cropW, cropH);
    ctx.save();

    // Center in crop window
    ctx.translate(cropW / 2 + pan.x, cropH / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Calculate base draw size to cover the crop box
    const imgRatio = img.width / img.height;
    const boxRatio = cropW / cropH;

    let drawW: number;
    let drawH: number;

    if (imgRatio > boxRatio) {
      drawH = cropH;
      drawW = drawH * imgRatio;
    } else {
      drawW = cropW;
      drawH = drawW / imgRatio;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [getCropDimensions, pan, rotation, scale]);

  useEffect(() => {
    drawCropPreview();
  }, [drawCropPreview]);

  // Mouse / Touch Dragging to Pan Image
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { x: clientX, y: clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const croppedUrl = canvas.toDataURL("image/png", 0.95);
    onCropComplete(croppedUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0a0a2f] border border-cyan-500/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,240,255,0.3)] flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-black text-slate-100">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Aspect Ratio Selector */}
        <div className="flex items-center gap-2 mb-4 w-full">
          <span className="text-xs font-bold text-slate-400 mr-2">Shape:</span>
          {[
            { id: "pillar", label: "🏛️ Pillar (Tall)" },
            { id: "square", label: "⬛ Square" },
            { id: "free", label: "📐 Standard" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setAspectRatio(item.id as typeof aspectRatio)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                aspectRatio === item.id
                  ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-md"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Crop Viewport */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          className="relative flex items-center justify-center w-full h-[360px] bg-slate-950/90 rounded-xl border border-dashed border-cyan-500/50 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        >
          {/* Canvas Rendering Preview */}
          <canvas
            ref={canvasRef}
            className="rounded-lg shadow-[0_0_25px_rgba(0,240,255,0.4)] pointer-events-none"
          />

          {/* Hint Overlay */}
          <div className="absolute bottom-2 flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-full text-[11px] text-cyan-300 pointer-events-none">
            <Move className="w-3 h-3" />
            Drag to reposition image inside obstacle
          </div>
        </div>

        {/* Controls: Zoom & Rotate */}
        <div className="w-full flex items-center justify-between gap-4 mt-4 px-2">
          {/* Zoom Control */}
          <div className="flex items-center gap-2 flex-1">
            <ZoomOut className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-400 cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono text-cyan-400 w-10 text-right">{scale.toFixed(1)}x</span>
          </div>

          {/* Rotate 90° */}
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
            title="Rotate 90 degrees"
          >
            <RotateCw className="w-3.5 h-3.5 text-purple-400" />
            {rotation}°
          </button>
        </div>

        {/* Actions Footer */}
        <div className="w-full grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.5)] transition-transform active:scale-95"
          >
            <Check className="w-4 h-4" />
            Apply Cropped Obstacle
          </button>
        </div>
      </div>
    </div>
  );
}
