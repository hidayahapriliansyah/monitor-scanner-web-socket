const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const ioScanning = new Server(server, { path: '/scanning' });

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

ioScanning.engine.use((req, res, next) => {
  
});

ioScanning.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('request-scanner', (data) => {
    if (data.data === 'some valid data') {
      console.log('data =>>>', data.data);
      ioScanning.emit('ticket-valid', data);
    } else {
      ioScanning.emit('ticket-not-valid', data);
    }
  });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});