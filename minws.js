'use strict';
/**
 * WebSocket client tối giản (zero dependency) để nói chuyện với Chrome DevTools Protocol.
 * Chỉ hỗ trợ text frame + payload < 64KB — đủ để gọi Runtime.evaluate / Page.navigate.
 */
const net = require('net');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class MiniWS extends EventEmitter {
  constructor(url) {
    super();
    const u = new URL(url);
    this.buf = Buffer.alloc(0);
    this.open = false;
    const port = Number(u.port || (u.protocol === 'wss:' ? 443 : 80));
    this.sock = net.connect(port, u.hostname, () => {
      const key = crypto.randomBytes(16).toString('base64');
      const pathPart = u.pathname + (u.search || '');
      this.sock.write(
        `GET ${pathPart} HTTP/1.1\r\n` +
        `Host: ${u.host}\r\n` +
        'Upgrade: websocket\r\nConnection: Upgrade\r\n' +
        `Sec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`
      );
    });
    this.sock.on('data', (d) => this._onData(d));
    this.sock.on('error', (e) => this.emit('error', e));
    this.sock.on('close', () => this.emit('close'));
  }

  _onData(d) {
    this.buf = Buffer.concat([this.buf, d]);
    if (!this.open) {
      const i = this.buf.indexOf('\r\n\r\n');
      if (i === -1) return;
      const head = this.buf.slice(0, i).toString();
      if (!/101/.test(head.split('\r\n')[0])) { this.emit('error', new Error('handshake thất bại: ' + head.split('\r\n')[0])); return; }
      this.buf = this.buf.slice(i + 4);
      this.open = true;
      this.emit('open');
    }
    while (this.buf.length >= 2) {
      const b0 = this.buf[0], b1 = this.buf[1];
      let len = b1 & 0x7f, off = 2;
      if (len === 126) { if (this.buf.length < 4) return; len = this.buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (this.buf.length < 10) return; len = Number(this.buf.readBigUInt64BE(2)); off = 10; }
      if (this.buf.length < off + len) return;
      let payload = this.buf.slice(off, off + len);
      this.buf = this.buf.slice(off + len);
      const op = b0 & 0x0f;
      if (op === 1) this.emit('message', payload.toString('utf8'));
      else if (op === 8) { this.sock.end(); this.emit('close'); }
      else if (op === 9) this._frame(0x0a, payload); // ping -> pong
    }
  }

  _frame(op, data) {
    const payload = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const len = payload.length;
    let header;
    if (len < 126) {
      header = Buffer.from([0x80 | len]);
    } else if (len < 65536) {
      header = Buffer.alloc(3);
      header[0] = 126;
      header.writeUInt16BE(len, 1);
    } else {
      header = Buffer.alloc(9);
      header[0] = 127;
      header.writeBigUInt64BE(BigInt(len), 1);
    }
    const mask = crypto.randomBytes(4);
    const masked = Buffer.alloc(len);
    for (let i = 0; i < len; i++) masked[i] = payload[i] ^ mask[i % 4];
    this.sock.write(Buffer.concat([Buffer.from([0x80 | op]), header, mask, masked]));
  }

  send(str) { this._frame(0x01, str); }
  close() { try { this._frame(0x08, Buffer.alloc(0)); } catch {} this.sock.end(); }
}

module.exports = MiniWS;
