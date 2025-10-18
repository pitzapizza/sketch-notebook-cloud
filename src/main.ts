// Canvas references
const bgCanvas = document.getElementById("backgroundCanvas") as HTMLCanvasElement;
const bgCtx = bgCanvas.getContext("2d")!;
const canvas = document.getElementById("sketchCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

// Toolbar elements
const brushSize = document.getElementById("brushSize") as HTMLInputElement;
const brushColor = document.getElementById("brushColor") as HTMLInputElement;
const eraserSize = document.getElementById("eraserSize") as HTMLInputElement;
const backgroundSelect = document.getElementById("backgroundSelect") as HTMLSelectElement;
const filenameInput = document.getElementById("filename") as HTMLInputElement;

const penBtn = document.getElementById("penBtn") as HTMLButtonElement;
const eraserBtn = document.getElementById("eraserBtn") as HTMLButtonElement;
const undoBtn = document.getElementById("undoBtn") as HTMLButtonElement;
const redoBtn = document.getElementById("redoBtn") as HTMLButtonElement;
const clearBtn = document.getElementById("clearBtn") as HTMLButtonElement;
const downloadBtn = document.getElementById("downloadBtn") as HTMLButtonElement;

// State
let drawing = false;
let mode: "pen" | "eraser" = "pen";
let penWidth = parseInt(brushSize.value);
let eraserWidth = parseInt(eraserSize.value);
let penColor = brushColor.value;
let hasChanges = false;

// Undo/redo
let undoStack: ImageData[] = [];
let redoStack: ImageData[] = [];

// Ensure background never blocks input
bgCanvas.style.pointerEvents = "none";

// Resize canvases to window (CSS pixels; keep it straightforward)
function resizeCanvas() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  bgCanvas.width = width;
  bgCanvas.height = height;

  canvas.width = width;
  canvas.height = height;

  drawBackground();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Background templates (drawn only on bgCanvas)
function drawBackground() {
  bgCtx.globalCompositeOperation = "source-over";
  bgCtx.fillStyle = "white";
  bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

  bgCtx.strokeStyle = "#d1d5db";
  bgCtx.lineWidth = 1;

  const w = bgCanvas.width;
  const h = bgCanvas.height;

  switch (backgroundSelect.value) {
    case "ruled": {
      for (let y = 40; y < h; y += 40) {
        bgCtx.beginPath();
        bgCtx.moveTo(0, y);
        bgCtx.lineTo(w, y);
        bgCtx.stroke();
      }
      break;
    }
    case "graph": {
      for (let x = 40; x < w; x += 40) {
        bgCtx.beginPath();
        bgCtx.moveTo(x, 0);
        bgCtx.lineTo(x, h);
        bgCtx.stroke();
      }
      for (let y = 40; y < h; y += 40) {
        bgCtx.beginPath();
        bgCtx.moveTo(0, y);
        bgCtx.lineTo(w, y);
        bgCtx.stroke();
      }
      break;
    }
    case "dots": {
      bgCtx.fillStyle = "#9ca3af";
      for (let x = 20; x < w; x += 40) {
        for (let y = 20; y < h; y += 40) {
          bgCtx.beginPath();
          bgCtx.arc(x, y, 2, 0, Math.PI * 2);
          bgCtx.fill();
        }
      }
      break;
    }
    case "plain":
    default:
      // already white filled
      break;
  }
}

// React to background change
backgroundSelect.addEventListener("change", () => {
  saveState();
  drawBackground();
});

// Coordinates relative to sketchCanvas
function getPos(e: MouseEvent | Touch) {
  const rect = canvas.getBoundingClientRect();
  const clientX = (e as MouseEvent).clientX ?? (e as Touch).clientX;
  const clientY = (e as MouseEvent).clientY ?? (e as Touch).clientY;
  return { x: clientX - rect.left, y: clientY - rect.top };
}

// Drawing functions
function startDraw(e: MouseEvent | Touch) {
  drawing = true;
  const { x, y } = getPos(e);
  ctx.beginPath();
  ctx.moveTo(x, y);
  saveState();
}
function endDraw() {
  drawing = false;
  ctx.beginPath();
}
function draw(e: MouseEvent | Touch) {
  if (!drawing) return;
  const { x, y } = getPos(e);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (mode === "pen") {
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = penWidth;
    ctx.strokeStyle = penColor;
  } else {
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = eraserWidth;
    // strokeStyle is ignored in destination-out
  }

  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  hasChanges = true;
}

// Mouse events
canvas.addEventListener("mousedown", (e) => startDraw(e));
canvas.addEventListener("mouseup", endDraw);
canvas.addEventListener("mouseleave", endDraw);
canvas.addEventListener("mousemove", (e) => draw(e));

// Touch events
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const t = e.touches[0];
  startDraw(t);
});
canvas.addEventListener("touchend", endDraw);
canvas.addEventListener("touchcancel", endDraw);
canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const t = e.touches[0];
  draw(t);
});

// Controls
brushSize.addEventListener("input", () => (penWidth = parseInt(brushSize.value)));
brushColor.addEventListener("input", () => (penColor = brushColor.value));
eraserSize.addEventListener("input", () => (eraserWidth = parseInt(eraserSize.value)));

penBtn.addEventListener("click", () => {
  mode = "pen";
  penBtn.classList.add("ring-2", "ring-indigo-500");
  eraserBtn.classList.remove("ring-2", "ring-indigo-500");
});
eraserBtn.addEventListener("click", () => {
  mode = "eraser";
  eraserBtn.classList.add("ring-2", "ring-indigo-500");
  penBtn.classList.remove("ring-2", "ring-indigo-500");
});

// Undo/Redo
function saveState() {
  try {
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    redoStack = [];
  } catch {
    // skip if too large; optional optimization could snapshot using toDataURL
  }
}
undoBtn.addEventListener("click", () => {
  if (undoStack.length > 0) {
    try {
      redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      const state = undoStack.pop()!;
      ctx.putImageData(state, 0, 0);
      hasChanges = true;
    } catch {}
  }
});
redoBtn.addEventListener("click", () => {
  if (redoStack.length > 0) {
    try {
      undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      const state = redoStack.pop()!;
      ctx.putImageData(state, 0, 0);
      hasChanges = true;
    } catch {}
  }
});

// Clear drawing layer only
clearBtn.addEventListener("click", () => {
  saveState();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hasChanges = true;
});

// Download: merge bg + drawing into one PNG
downloadBtn.addEventListener("click", () => {
  const name = filenameInput.value.trim() || "sketch";
  if (!hasChanges) {
    const confirmDownload = confirm("No changes detected. Do you still want to download?");
    if (!confirmDownload) return;
  }

  const merged = document.createElement("canvas");
  merged.width = canvas.width;
  merged.height = canvas.height;
  const mctx = merged.getContext("2d")!;

  mctx.drawImage(bgCanvas, 0, 0);
  mctx.drawImage(canvas, 0, 0);

  const link = document.createElement("a");
  link.download = `${name}.png`;
  link.href = merged.toDataURL("image/png");
  link.click();
  hasChanges = false;
});