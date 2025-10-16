const canvas = document.getElementById("sketchCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const clearBtn = document.getElementById("clearBtn")!;
const downloadBtn = document.getElementById("downloadBtn")!;

let drawing = false;

canvas.addEventListener("mousedown", () => {
  drawing = true;
  ctx.beginPath();
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
  ctx.beginPath();
});

canvas.addEventListener("mousemove", draw);

function draw(e: MouseEvent) {
  if (!drawing) return;

  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#4F46E5"; // Indigo-600

  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
}

clearBtn.addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "sketch.png";
  link.href = canvas.toDataURL();
  link.click();
});