const ctx = document.getElementById("marketGraph").getContext("2d");
let data = Array.from({length:50}, () => Math.random()*100);

function drawGraph() {
    ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    ctx.moveTo(0, ctx.canvas.height - data[0]);
    for(let i=1;i<data.length;i++){
        ctx.lineTo(i*10, ctx.canvas.height - data[i]);
    }
    ctx.strokeStyle = "lime";
    ctx.stroke();
    data.push(Math.random()*100);
    data.shift();
}
setInterval(drawGraph, 500);
