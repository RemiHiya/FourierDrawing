const canvas = document.getElementById("canvas");
const precisionInput = document.getElementById("precision");
const ctx = canvas.getContext("2d");

var pressed = false;
var coords = [];
var X = [];
var time = 0;
var path = [];
var animating = false;
var precision = 10;

var duration = 3;

precisionInput.addEventListener("change", function () {
    precision = precisionInput.value;
});

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

canvas.addEventListener("mousedown", function () {
    pressed = true;
    coords = [];
    path = [];
    animating = false;
});

canvas.addEventListener("mouseup", function () {
    pressed = false;
    if (coords.length < 2) return;
    X = computeDFT(coords, precision); // nombre de coefficients
    time = 0;
    path = [];
    animating = true;
    startTime = performance.now();
    animate();
});

document.onmousemove = function (e) {
    if (!pressed) return;
    const rect = canvas.getBoundingClientRect();
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    coords.push({
        x: e.clientX - rect.left - cx,
        y: e.clientY - rect.top - cy
    });
    drawPoints();
};

function drawPoints() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFFFFF";

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    for (const p of coords) {
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    // petit repère visuel du centre
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
    ctx.fillStyle = "#FF0000";
    ctx.fill();
}

function computeDFT(points, N) {
    const nPoints = points.length;
    const result = [];
    for (let k = 0; k < N; k++) {
        let re = 0,
            im = 0;
        for (let n = 0; n < nPoints; n++) {
            const phi = (2 * Math.PI * k * n) / nPoints;
            re += points[n].x * Math.cos(phi) + points[n].y * Math.sin(phi);
            im += -points[n].x * Math.sin(phi) + points[n].y * Math.cos(phi);
        }
        re /= nPoints;
        im /= nPoints;
        result.push({
            re,
            im,
            freq: k,
            amp: Math.sqrt(re * re + im * im),
            phase: Math.atan2(im, re)
        });
    }
    result.sort((a, b) => b.amp - a.amp);
    return result;
}

function drawEpicycles(x, y, fourier, t) {
    for (let i = 0; i < fourier.length; i++) {
        const f = fourier[i];
        const prevx = x;
        const prevy = y;

        x += f.amp * Math.cos(f.freq * t + f.phase);
        y += f.amp * Math.sin(f.freq * t + f.phase);

        // cercle
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.arc(prevx, prevy, f.amp, 0, 2 * Math.PI);
        ctx.stroke();

        // ligne
        ctx.beginPath();
        ctx.moveTo(prevx, prevy);
        ctx.lineTo(x, y);
        ctx.strokeStyle = "#FFFFFF";
        ctx.stroke();
    }
    return { x, y };
}

let startTime = 0;

function animate() {
    if (!animating) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const endPoint = drawEpicycles(centerX, centerY, X, time);

    path.unshift(endPoint);
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.strokeStyle = "#00FFFF";
    ctx.stroke();

    // progression du temps basée sur la durée choisie
    const elapsed = (performance.now() - startTime) / 1000; // secondes
    time = (elapsed / duration) * 2 * Math.PI;

    if (elapsed < duration) {
        requestAnimationFrame(animate);
    } else {
        startTime = performance.now();

        requestAnimationFrame(animate);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}
