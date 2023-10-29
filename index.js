const { createServer } = require('node:http');
const { join } = require('node:path');

const express = require('express');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');

const app = express();
app.use(express.json());
app.use(cookieParser());

const server = createServer(app);
const ioScanning = new Server(server, { path: '/scanning' });

let id = '';

ioScanning.use((socket, next) => {
  console.log('check middleware enging');
  id = (socket.request.headers.cookie).split('=')[1];
  next();
});

// disini ada join room berdasarkan id dari gate id.

ioScanning.on('connection', (socket) => {
  console.log('id =>>>', id);
  socket.join(id);

  console.log('pass middleware, id =>>> ' + id);
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.get('/first-page', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.get('/second-page', (req, res) => {
  res.sendFile(join(__dirname, 'index2.html'));
});

app.get('/monitor', (req, res) => {
  res.sendFile(join(__dirname, 'monitor.html'));
});

app.get('/scanner', (req, res) => {
  res.sendFile(join(__dirname, 'scanner.html'));
});

app.post('/scanning', (req, res) => {
  const token = req.cookies.token;
  const data = req.body;
  console.log('token =>>>', token);

  if (data.isValid === '1') {
    ioScanning.to(token).emit('ticket-valid', data);
  } else {
    ioScanning.to(token).emit('ticket-not-valid', data);
  }

  res.json({
    message: 'ok'
  });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});