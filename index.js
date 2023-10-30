const { createServer } = require('node:http');
const { join } = require('node:path');

const express = require('express');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');

const organizerScannerData = require('./data.js');

const app = express();
app.use(express.json());
app.use(cookieParser());

const server = createServer(app);
const ioScanning = new Server(server, { path: '/scanning' });

let gateId = '';

ioScanning.use((socket, next) => {
  console.log('check middleware enging');
  // socket request headers cookie itu diambil dari request http cookie
  gateId = (socket.request.headers.cookie).split('=')[1];
  next();
});

// disini ada join room berdasarkan id dari gate id.

ioScanning.on('connection', (socket) => {
  socket.join(gateId);

  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.get('/super-admin/monitor', (req, res) => {
  res.sendFile(join(__dirname, 'super-admin-monitor.html'));
});

app.get('/super-admin/scanner', (req, res) => {
  res.sendFile(join(__dirname, 'super-admin-scanner.html'));
});

app.get('/super-admin/gate-watcher', (req, res) => {
  res.sendFile(join(__dirname, 'gate-watcher.html'));
});

app.get('/gate/monitor', (req, res) => {
  res.sendFile(join(__dirname, 'gate-monitor.html'));
});

app.get('/gate/scanner', (req, res) => {
  res.sendFile(join(__dirname, 'gate-scanner.html'));
});

app.post('/scanning', (req, res) => {
  const gateId = req.cookies.token;
  const data = req.body;

  if (data.isValid === '1') {
    const gateFromSuperAdmin = organizerScannerData.superAdmin.find((organizer) => organizer.id === gateId);
    if (gateFromSuperAdmin) {
      console.log('gateFromSuperAdmin =>>', gateFromSuperAdmin);
      ioScanning.to(gateId).emit('ticket-valid', data);
      ioScanning.to(gateFromSuperAdmin.id).emit('incoming-new-gate-data', data);
    } else {
      const gateData = organizerScannerData.gate.find((gate) => gate.id === gateId);
      if (gateData) {
        ioScanning.to(gateId).emit('ticket-valid', data);
        ioScanning.to(gateData.superAdminId).emit('incoming-new-gate-data', data);
      }
    }
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