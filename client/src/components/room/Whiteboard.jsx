import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { motion } from 'framer-motion';
import { PenTool, Square, Circle, Type, Eraser, Download, Undo, Redo } from 'lucide-react';

const Whiteboard = ({ socket, roomId }) => {
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [color, setColor] = useState('#D97757');
  const [mode, setMode] = useState('draw'); // draw, select, erase
  
  const history = useRef([]);
  const historyIndex = useRef(-1);
  const isUpdating = useRef(false);

  useEffect(() => {
    const initCanvas = new fabric.Canvas(canvasRef.current, {
      width: canvasRef.current.parentElement.clientWidth,
      height: canvasRef.current.parentElement.clientHeight,
      isDrawingMode: true,
      backgroundColor: '#FDFBF7'
    });
    
    initCanvas.freeDrawingBrush.color = color;
    initCanvas.freeDrawingBrush.width = 3;
    setCanvas(initCanvas);

    const handleResize = () => {
      initCanvas.setWidth(canvasRef.current.parentElement.clientWidth);
      initCanvas.setHeight(canvasRef.current.parentElement.clientHeight);
      initCanvas.renderAll();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      initCanvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!canvas || !socket) return;

    // Load initial canvas state
    socket.emit('request-canvas-state', roomId);
    
    socket.on('canvas-state-from-server', (state) => {
      if (state) {
        isUpdating.current = true;
        canvas.loadFromJSON(state, () => {
          canvas.renderAll();
          isUpdating.current = false;
        });
      }
    });

    socket.on('canvas-update', (data) => {
      isUpdating.current = true;
      fabric.util.enlivenObjects([data], (objects) => {
        objects.forEach(obj => canvas.add(obj));
        canvas.renderAll();
        isUpdating.current = false;
      });
    });

    socket.on('canvas-clear', () => {
      isUpdating.current = true;
      canvas.clear();
      canvas.backgroundColor = '#FDFBF7';
      isUpdating.current = false;
    });

    const handleObjectAdded = (e) => {
      if (isUpdating.current) return;
      const obj = e.target;
      if (!obj) return;
      socket.emit('canvas-update', { roomId, data: obj.toJSON() });
      
      // Basic History
      history.current = history.current.slice(0, historyIndex.current + 1);
      history.current.push(canvas.toJSON());
      historyIndex.current++;
    };

    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:modified', handleObjectAdded);

    return () => {
      socket.off('canvas-state-from-server');
      socket.off('canvas-update');
      socket.off('canvas-clear');
      canvas.off('object:added');
      canvas.off('object:modified');
    };
  }, [canvas, socket, roomId]);

  useEffect(() => {
    if (!canvas) return;
    canvas.isDrawingMode = mode === 'draw' || mode === 'erase';
    canvas.freeDrawingBrush.color = mode === 'erase' ? '#FDFBF7' : color;
    canvas.freeDrawingBrush.width = mode === 'erase' ? 20 : 3;
    
    if (mode === 'select') {
      canvas.selection = true;
      canvas.forEachObject(obj => obj.selectable = true);
    } else {
      canvas.selection = false;
      canvas.forEachObject(obj => obj.selectable = false);
    }
  }, [mode, color, canvas]);

  const addShape = (type) => {
    if (!canvas) return;
    let shape;
    if (type === 'rect') {
      shape = new fabric.Rect({ left: 100, top: 100, fill: color, width: 60, height: 60 });
    } else if (type === 'circle') {
      shape = new fabric.Circle({ left: 100, top: 100, fill: color, radius: 30 });
    } else if (type === 'text') {
      shape = new fabric.IText('Type here', { left: 100, top: 100, fill: color, fontFamily: 'DM Sans' });
    }
    if (shape) {
      canvas.add(shape);
      setMode('select');
    }
  };

  const clearCanvas = () => {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = '#FDFBF7';
    socket.emit('canvas-clear', roomId);
  };

  const exportCanvas = () => {
    if (!canvas) return;
    const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
    const link = document.createElement('a');
    link.download = 'board.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative w-full h-full border-l border-border bg-white flex flex-col">
      <div className="h-12 border-b border-border bg-surface flex items-center px-4 gap-4 overflow-x-auto shrink-0 z-10">
        <button onClick={() => setMode('draw')} className={`p-1.5 rounded transition-colors ${mode === 'draw' ? 'bg-primary text-white' : 'hover:bg-gray-100 text-textSecondary'}`}><PenTool size={18} /></button>
        <button onClick={() => setMode('erase')} className={`p-1.5 rounded transition-colors ${mode === 'erase' ? 'bg-primary text-white' : 'hover:bg-gray-100 text-textSecondary'}`}><Eraser size={18} /></button>
        <button onClick={() => addShape('rect')} className="p-1.5 rounded hover:bg-gray-100 text-textSecondary"><Square size={18} /></button>
        <button onClick={() => addShape('circle')} className="p-1.5 rounded hover:bg-gray-100 text-textSecondary"><Circle size={18} /></button>
        <button onClick={() => addShape('text')} className="p-1.5 rounded hover:bg-gray-100 text-textSecondary"><Type size={18} /></button>
        
        <div className="w-px h-6 bg-border mx-2"></div>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer p-0 border-0" />
        <div className="w-px h-6 bg-border mx-2"></div>
        
        <button onClick={clearCanvas} className="px-3 py-1.5 rounded text-red-500 hover:bg-red-50 text-sm font-medium border border-red-200">Clear</button>
        <button onClick={exportCanvas} className="p-1.5 rounded hover:bg-gray-100 ml-auto text-textSecondary"><Download size={18} /></button>
      </div>
      <div className="flex-1 w-full relative overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    </div>
  );
};

export default Whiteboard;
