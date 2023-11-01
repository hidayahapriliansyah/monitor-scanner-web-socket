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

// bikin array buat nampung gate apa yang terkoneksi
// ketika on connection kalau id nya gak ada di list maka buat baru
// ketika on disconnect kalau scanner nya udah gak ada yang konek sama sekali maka hapus dari array

let connectedScannerGate = [];
// bentuknya [{ id: , countConnectedScanner: number, }]

ioScanning.on('connection', (socket) => {
  socket.join(gateId);

  console.log('a user connected');
  const { role } = socket.handshake.auth;
  console.log('socket.handshake.auth =>>', socket.handshake.auth);
  if (role === 'scanner') {
    const connectedScannerIndex = connectedScannerGate.findIndex((scannerGate) => scannerGate.id === gateId);
    if (connectedScannerIndex !== -1) {
      const connectedScanner = connectedScannerGate[connectedScannerIndex];
      const updatedConnectedScanner = {
        ...connectedScanner,
        countConnectedScanner: connectedScanner.countConnectedScanner + 1,
      };

      connectedScannerGate[connectedScannerIndex] = updatedConnectedScanner;
      socket
        .to(updatedConnectedScanner.id)
        .emit('connected-scanner', updatedConnectedScanner.countConnectedScanner);
    } else {
      connectedScannerGate = [...connectedScannerGate, {
        id: gateId,
        countConnectedScanner: 1,
      }];
      socket
        .to(gateId)
        .emit('connected-scanner', 1);
    }
  } else if (role === 'monitor') {
    // const connectedScannerIndex = connectedScannerGate.findIndex((scannerGate) => scannerGate.id === gateId);
    // console.log("role === 'monitor'");
    // console.log('connectedScannerGate =>>', connectedScannerGate);
    // if (connectedScannerIndex !== -1) {
    //   const connectedScanner = connectedScannerGate[connectedScannerIndex];
    //   console.log('connectedScannerIndex =>>', connectedScannerIndex);
    //   console.log('connectedScannerCount =>>', connectedScanner.countConnectedScanner);
    //   socket
    //     .to(gateId)
    //     .emit('connected-scanner', connectedScanner.countConnectedScanner);
    // } else {
    //   socket
    //     .to(gateId)
    //     .emit('connected-scanner', 0);  
    // }

    socket.on('check-connected-scanner-count', (callback) => {
      let connectedScannerCount = 0;
      const connectedScannerIndex = connectedScannerGate.findIndex((scannerGate) => scannerGate.id === gateId);
      console.log("role === 'monitor'");
      console.log('connectedScannerGate =>>', connectedScannerGate);
      if (connectedScannerIndex !== -1) {
        const connectedScanner = connectedScannerGate[connectedScannerIndex];
        connectedScannerCount = connectedScanner.countConnectedScanner;
      }
      callback({
        connectedScannerCount,
      });
    });
  }

  socket.on('disconnect', () => {
    if (role === 'scanner') {
      const connectedScannerIndex = connectedScannerGate.findIndex((scannerGate) => scannerGate.id === gateId);
      if (connectedScannerIndex !== -1) {
        const connectedScanner = connectedScannerGate[connectedScannerIndex];
        console.log('connectedScanner.countConnectedScanner disconnet =>>', connectedScanner.countConnectedScanner);
        if (connectedScanner.countConnectedScanner !== 1) {
          const reducedCountConnectedScanner = {
            ...connectedScanner,
            countConnectedScanner: connectedScanner.countConnectedScanner - 1,
          }

          connectedScannerGate[connectedScannerIndex] = reducedCountConnectedScanner;
          socket
            .to(reducedCountConnectedScanner.id)
            .emit('connected-scanner', reducedCountConnectedScanner.countConnectedScanner);
        } else {
          connectedScannerGate.splice(connectedScannerIndex, 1);
            socket
            .to(gateId)
            .emit('connected-scanner', 0);
        }
      }
    }
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