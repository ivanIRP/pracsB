import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "eventos.json");

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]");
}

const server = http.createServer((req, res) => {
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Gestor de Eventos</title>
        <style>
          body { font-family: Arial; background:#f5f5f5; padding:20px; }
          input, button { margin:5px; padding:8px; }
          .evento { background:white; margin:10px 0; padding:10px; border-radius:5px; box-shadow:0 0 5px rgba(0,0,0,0.1); }
          .completado { text-decoration: line-through; color: gray; }
        </style>
      </head>
      <body>
        <h1>Gestor de Eventos</h1>
        <input id="nombre" placeholder="Nombre del evento">
        <input id="fecha" type="date">
        <input id="organizador" placeholder="Organizador">
        <button onclick="agregar()">Agregar</button>
        <h2>Lista de eventos</h2>
        <div id="lista"></div>
        <script>
          async function cargar() {
            const res = await fetch('/eventos');
            const eventos = await res.json();
            const lista = document.getElementById('lista');
            lista.innerHTML = '';
            eventos.forEach(e => {
              const div = document.createElement('div');
              div.className = 'evento' + (e.completado ? ' completado' : '');
              div.innerHTML = \`
                <b>\${e.nombre}</b> - \${e.fecha} - \${e.organizador}
                <button onclick="eliminar(\${e.id})">Eliminar</button>
                <button onclick="toggle(\${e.id})">\${e.completado ? 'Desmarcar' : 'Completado'}</button>
              \`;
              lista.appendChild(div);
            });
          }
          async function agregar() {
            const nombre = document.getElementById('nombre').value;
            const fecha = document.getElementById('fecha').value;
            const organizador = document.getElementById('organizador').value;
            if(!nombre || !fecha || !organizador) return alert('Completa todos los campos');
            await fetch('/eventos', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ nombre, fecha, organizador })
            });
            cargar();
          }
          async function eliminar(id) {
            await fetch('/eventos/' + id, { method: 'DELETE' });
            cargar();
          }
          async function toggle(id) {
            await fetch('/eventos/' + id, { method: 'PATCH' });
            cargar();
          }
          cargar();
        </script>
      </body>
      </html>
    `);
  } else if (req.url === "/eventos" && req.method === "GET") {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(data);
  } else if (req.url === "/eventos" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", () => {
      const evento = JSON.parse(body);
      const eventos = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      evento.id = Date.now();
      evento.completado = false;
      eventos.push(evento);
      fs.writeFileSync(DATA_FILE, JSON.stringify(eventos, null, 2));
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Evento agregado" }));
    });
  } else if (req.url.startsWith("/eventos/") && req.method === "DELETE") {
    const id = req.url.split("/")[2];
    const eventos = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")).filter(e => e.id != id);
    fs.writeFileSync(DATA_FILE, JSON.stringify(eventos, null, 2));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Evento eliminado" }));
  } else if (req.url.startsWith("/eventos/") && req.method === "PATCH") {
    const id = req.url.split("/")[2];
    const eventos = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")).map(e => {
      if (e.id == id) e.completado = !e.completado;
      return e;
    });
    fs.writeFileSync(DATA_FILE, JSON.stringify(eventos, null, 2));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Evento actualizado" }));
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Página no encontrada");
  }
});

server.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
