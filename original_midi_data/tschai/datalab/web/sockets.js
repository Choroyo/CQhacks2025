"use strict";
/*
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketAdapter = exports.SocketIOAdapter = void 0;
exports.init = init;
exports.isSocketIoPath = isSocketIoPath;
var events_1 = require("events");
var socketio = require("socket.io");
var url = require("url");
// tslint:disable-next-line:enforce-name-casing
var webSocket = require("ws");
var logging = require("./logging");
var sessionCounter = 0;
/**
 * The application settings instance.
 */
var appSettings;
/**
 * Creates a WebSocket connected to the Jupyter server for the URL in the
 * specified session.
 */
function createWebSocket(socketHost, port, session) {
    var path = url.parse(session.url).path;
    var socketUrl = "ws://".concat(socketHost, ":").concat(port).concat(path);
    logging.getLogger().debug('Creating WebSocket to %s for session %d', socketUrl, session.id);
    var ws = new webSocket(socketUrl);
    ws.on('open', function () {
        // Stash the resulting WebSocket, now that it is in open state
        session.webSocket = ws;
        session.socket.emit('open', { url: session.url });
    })
        .on('close', function () {
        // Remove the WebSocket from the session, once it is in closed state
        logging.getLogger().debug('WebSocket [%d] closed', session.id);
        session.webSocket = null;
        session.socket.emit('close', { url: session.url });
    })
        .on('message', function (data) {
        // Propagate messages arriving on the WebSocket to the client.
        if (data instanceof Buffer) {
            logging.getLogger().debug('WebSocket [%d] binary message length %d', session.id, data.length);
        }
        else {
            logging.getLogger().debug('WebSocket [%d] message\n%j', session.id, data);
        }
        session.socket.emit('data', { data: data });
    })
        // tslint:disable-next-line:no-any
        .on('error', function (e) {
        logging.getLogger().error('WebSocket [%d] error\n%j', session.id, e);
        if (e.code === 'ECONNREFUSED') {
            // This happens in the following situation -- old kernel that has gone
            // away likely due to a restart/shutdown... and an old notebook client
            // attempts to reconnect to the old kernel. That connection will be
            // refused. In this case, there is no point in keeping this socket.io
            // connection open.
            session.socket.disconnect(/* close */ true);
        }
    });
    return ws;
}
/**
 * Closes the WebSocket instance associated with the session.
 */
function closeWebSocket(session) {
    if (session.webSocket) {
        session.webSocket.close();
        session.webSocket = null;
    }
}
/**
 * Handles communication over the specified socket.
 */
function socketHandler(socket) {
    sessionCounter++;
    // Each socket is associated with a session that tracks the following:
    // - id: a counter for use in log output
    // - url: the url used to connect to the Jupyter server
    // - socket: the socket.io socket reference, which generates message
    //           events for anything sent by the browser client, and allows
    //           emitting messages to send to the browser
    // - webSocket: the corresponding WebSocket connection to the Jupyter
    //              server.
    // Within a session, messages recieved over the socket.io socket (from the
    // browser) are relayed to the WebSocket, and messages recieved over the
    // WebSocket socket are relayed back to the socket.io socket (to the browser).
    var session = { id: sessionCounter, url: '', socket: socket, webSocket: null };
    logging.getLogger().debug('Socket connected for session %d', session.id);
    socket.on('disconnect', function (reason) {
        logging.getLogger().debug('Socket disconnected for session %d reason: %s', session.id, reason);
        // Handle client disconnects to close WebSockets, so as to free up resources
        closeWebSocket(session);
    });
    socket.on('start', function (message) {
        logging.getLogger().debug('Start in session %d with url %s', session.id, message.url);
        try {
            var port = appSettings.nextJupyterPort;
            if (appSettings.kernelManagerProxyPort) {
                port = appSettings.kernelManagerProxyPort;
                logging.getLogger().debug('Using kernel manager proxy port %d', port);
            }
            var host = 'localhost';
            if (appSettings.kernelManagerProxyHost) {
                host = appSettings.kernelManagerProxyHost;
            }
            session.url = message.url;
            session.webSocket = createWebSocket(host, port, session);
            // tslint:disable-next-line:no-any
        }
        catch (e) {
            logging.getLogger().error(e, 'Unable to create WebSocket connection to %s', message.url);
            session.socket.disconnect(/* close */ true);
        }
    });
    socket.on('stop', function (message) {
        logging.getLogger().debug('Stop in session %d with url %s', session.id, message.url);
        closeWebSocket(session);
    });
    socket.on('data', function (message) {
        // Propagate the message over to the WebSocket.
        if (session.webSocket) {
            if (message instanceof Buffer) {
                logging.getLogger().debug('Send binary data of length %d in session %d.', message.length, session.id);
                session.webSocket.send(message, function (e) {
                    if (e) {
                        logging.getLogger().error(e, 'Failed to send message to websocket');
                    }
                });
            }
            else {
                logging.getLogger().debug('Send data in session %d\n%s', session.id, message.data);
                session.webSocket.send(message.data, function (e) {
                    if (e) {
                        logging.getLogger().error(e, 'Failed to send message to websocket');
                    }
                });
            }
        }
        else {
            logging.getLogger().error('Unable to send message; WebSocket is not open');
        }
    });
}
/** Initialize the socketio handler. */
function init(server, settings) {
    appSettings = settings;
    var io = socketio(server, {
        path: '/socket.io',
        transports: ['polling'],
        allowUpgrades: false,
        // v2.10 changed default from 60s to 5s, prefer the longer timeout to
        // avoid errant disconnects.
        pingTimeout: 60000,
    });
    io.of('/session').on('connection', socketHandler);
    return io;
}
/** Return true iff path is handled by socket.io. */
function isSocketIoPath(path) {
    return path.indexOf('/socket.io/') === 0;
}
/** A base class for socket classes adapting to the Socket interface. */
var Adapter = /** @class */ (function () {
    function Adapter() {
        this.emitter = new events_1.EventEmitter();
    }
    Adapter.prototype.onClose = function (listener) {
        this.emitter.on('close', listener);
    };
    Adapter.prototype.onStringMessage = function (listener) {
        this.emitter.on('string_message', listener);
    };
    Adapter.prototype.onBinaryMessage = function (listener) {
        this.emitter.on('binary_message', listener);
    };
    return Adapter;
}());
/** A socket adapter for socket.io.  */
var SocketIOAdapter = /** @class */ (function (_super) {
    __extends(SocketIOAdapter, _super);
    function SocketIOAdapter(socket) {
        var _this = _super.call(this) || this;
        _this.socket = socket;
        _this.socket.on('error', function (err) {
            logging.getLogger().error("error on socket.io: ".concat(err));
            // Event unsupported in Socket.
        });
        _this.socket.on('disconnecting', function () {
            logging.getLogger().error("disconnecting socket.io");
            // Event unsupported in Socket.
        });
        _this.socket.on('disconnect', function (reason) {
            _this.emitter.emit('close', reason);
        });
        _this.socket.on('data', function (event) {
            if (event instanceof Buffer) {
                _this.emitter.emit('binary_message', event);
            }
            else if (typeof event.data === 'string') {
                _this.emitter.emit('string_message', event.data);
            }
            else {
                _this.emitter.emit('binary_message', event.data);
            }
        });
        return _this;
    }
    SocketIOAdapter.prototype.sendString = function (data) {
        this.socket.emit('data', { data: data });
    };
    SocketIOAdapter.prototype.sendBinary = function (data) {
        this.socket.emit('data', { data: data });
    };
    SocketIOAdapter.prototype.close = function (keepTransportOpen) {
        this.socket.disconnect(!keepTransportOpen);
    };
    return SocketIOAdapter;
}(Adapter));
exports.SocketIOAdapter = SocketIOAdapter;
/** A socket adapter for websockets.  */
var WebSocketAdapter = /** @class */ (function (_super) {
    __extends(WebSocketAdapter, _super);
    function WebSocketAdapter(ws) {
        var _this = _super.call(this) || this;
        _this.ws = ws;
        _this.ws.on('error', function (err) {
            logging.getLogger().error("websocket error: ".concat(err));
        });
        _this.ws.on('disconnecting', function () {
            logging.getLogger().error("disconnecting websocket");
            // Event unsupported in Socket.
        });
        _this.ws.on('close', function (code, reason) {
            _this.emitter.emit('close', "code:".concat(code, " reason:").concat(reason));
        });
        _this.ws.on('message', function (data) {
            if (typeof data === 'string') {
                _this.emitter.emit('string_message', data);
            }
            else {
                _this.emitter.emit('binary_message', data);
            }
        });
        return _this;
    }
    WebSocketAdapter.prototype.sendString = function (data) {
        if (this.ws.readyState === webSocket.OPEN) {
            this.ws.send(data);
        }
    };
    WebSocketAdapter.prototype.sendBinary = function (data) {
        if (this.ws.readyState === webSocket.OPEN) {
            this.ws.send(data);
        }
    };
    // tslint:disable-next-line:no-unused-variable
    WebSocketAdapter.prototype.close = function (keepTransportOpen) {
        this.ws.close();
    };
    return WebSocketAdapter;
}(Adapter));
exports.WebSocketAdapter = WebSocketAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ja2V0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3RoaXJkX3BhcnR5L2NvbGFiL3NvdXJjZXMvc29ja2V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7O0dBY0c7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTRMSCxvQkFjQztBQUdELHdDQUVDO0FBN01ELGlDQUFvQztBQUVwQyxvQ0FBc0M7QUFDdEMseUJBQTJCO0FBQzNCLCtDQUErQztBQUMvQyw4QkFBZ0M7QUFHaEMsbUNBQXFDO0FBaUJyQyxJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUM7QUFFdkI7O0dBRUc7QUFDSCxJQUFJLFdBQXdCLENBQUM7QUFFN0I7OztHQUdHO0FBQ0gsU0FBUyxlQUFlLENBQ3BCLFVBQWtCLEVBQUUsSUFBWSxFQUFFLE9BQWdCO0lBQ3BELElBQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUN6QyxJQUFNLFNBQVMsR0FBRyxlQUFRLFVBQVUsY0FBSSxJQUFJLFNBQUcsSUFBSSxDQUFFLENBQUM7SUFDdEQsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FDckIseUNBQXlDLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUV0RSxJQUFNLEVBQUUsR0FBRyxJQUFJLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNwQyxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFDTjtRQUNFLDhEQUE4RDtRQUM5RCxPQUFPLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUN2QixPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBQyxDQUFDLENBQUM7SUFDbEQsQ0FBQyxDQUFDO1NBQ0gsRUFBRSxDQUFDLE9BQU8sRUFD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b3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90XG4gKiB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZlxuICogdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVRcbiAqIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZVxuICogTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnMgdW5kZXJcbiAqIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICdldmVudHMnO1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIHNvY2tldGlvIGZyb20gJ3NvY2tldC5pbyc7XG5pbXBvcnQgKiBhcyB1cmwgZnJvbSAndXJsJztcbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTplbmZvcmNlLW5hbWUtY2FzaW5nXG5pbXBvcnQgKiBhcyB3ZWJTb2NrZXQgZnJvbSAnd3MnO1xuXG5pbXBvcnQge0FwcFNldHRpbmdzfSBmcm9tICcuL2FwcFNldHRpbmdzJztcbmltcG9ydCAqIGFzIGxvZ2dpbmcgZnJvbSAnLi9sb2dnaW5nJztcblxuaW50ZXJmYWNlIFNlc3Npb24ge1xuICBpZDogbnVtYmVyO1xuICB1cmw6IHN0cmluZztcbiAgc29ja2V0OiBTb2NrZXRJTy5Tb2NrZXQ7XG4gIHdlYlNvY2tldDogd2ViU29ja2V0fG51bGw7XG59XG5cbmludGVyZmFjZSBTZXNzaW9uTWVzc2FnZSB7XG4gIHVybDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgRGF0YU1lc3NhZ2Uge1xuICBkYXRhOiBzdHJpbmc7XG59XG5cbmxldCBzZXNzaW9uQ291bnRlciA9IDA7XG5cbi8qKlxuICogVGhlIGFwcGxpY2F0aW9uIHNldHRpbmdzIGluc3RhbmNlLlxuICovXG5sZXQgYXBwU2V0dGluZ3M6IEFwcFNldHRpbmdzO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBXZWJTb2NrZXQgY29ubmVjdGVkIHRvIHRoZSBKdXB5dGVyIHNlcnZlciBmb3IgdGhlIFVSTCBpbiB0aGVcbiAqIHNwZWNpZmllZCBzZXNzaW9uLlxuICovXG5mdW5jdGlvbiBjcmVhdGVXZWJTb2NrZXQoXG4gICAgc29ja2V0SG9zdDogc3RyaW5nLCBwb3J0OiBudW1iZXIsIHNlc3Npb246IFNlc3Npb24pOiB3ZWJTb2NrZXQge1xuICBjb25zdCBwYXRoID0gdXJsLnBhcnNlKHNlc3Npb24udXJsKS5wYXRoO1xuICBjb25zdCBzb2NrZXRVcmwgPSBgd3M6Ly8ke3NvY2tldEhvc3R9OiR7cG9ydH0ke3BhdGh9YDtcbiAgbG9nZ2luZy5nZXRMb2dnZXIoKS5kZWJ1ZyhcbiAgICAgICdDcmVhdGluZyBXZWJTb2NrZXQgdG8gJXMgZm9yIHNlc3Npb24gJWQnLCBzb2NrZXRVcmwsIHNlc3Npb24uaWQpO1xuXG4gIGNvbnN0IHdzID0gbmV3IHdlYlNvY2tldChzb2NrZXRVcmwpO1xuICB3cy5vbignb3BlbicsXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICAvLyBTdGFzaCB0aGUgcmVzdWx0aW5nIFdlYlNvY2tldCwgbm93IHRoYXQgaXQgaXMgaW4gb3BlbiBzdGF0ZVxuICAgICAgICAgIHNlc3Npb24ud2ViU29ja2V0ID0gd3M7XG4gICAgICAgICAgc2Vzc2lvbi5zb2NrZXQuZW1pdCgnb3BlbicsIHt1cmw6IHNlc3Npb24udXJsfSk7XG4gICAgICAgIH0pXG4gICAgICAub24oJ2Nsb3NlJyxcbiAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAvLyBSZW1vdmUgdGhlIFdlYlNvY2tldCBmcm9tIHRoZSBzZXNzaW9uLCBvbmNlIGl0IGlzIGluIGNsb3NlZCBzdGF0ZVxuICAgICAgICAgICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5kZWJ1ZygnV2ViU29ja2V0IFslZF0gY2xvc2VkJywgc2Vzc2lvbi5pZCk7XG4gICAgICAgICAgICBzZXNzaW9uLndlYlNvY2tldCA9IG51bGw7XG4gICAgICAgICAgICBzZXNzaW9uLnNvY2tldC5lbWl0KCdjbG9zZScsIHt1cmw6IHNlc3Npb24udXJsfSk7XG4gICAgICAgICAgfSlcbiAgICAgIC5vbignbWVzc2FnZScsXG4gICAgICAgICAgKGRhdGEpID0+IHtcbiAgICAgICAgICAgIC8vIFByb3BhZ2F0ZSBtZXNzYWdlcyBhcnJpdmluZyBvbiB0aGUgV2ViU29ja2V0IHRvIHRoZSBjbGllbnQuXG4gICAgICAgICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgICAgICAgICBsb2dnaW5nLmdldExvZ2dlcigpLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgJ1dlYlNvY2tldCBbJWRdIGJpbmFyeSBtZXNzYWdlIGxlbmd0aCAlZCcsIHNlc3Npb24uaWQsXG4gICAgICAgICAgICAgICAgICBkYXRhLmxlbmd0aCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBsb2dnaW5nLmdldExvZ2dlcigpLmRlYnVnKFxuICAgICAgICAgICAgICAgICAgJ1dlYlNvY2tldCBbJWRdIG1lc3NhZ2VcXG4laicsIHNlc3Npb24uaWQsIGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2Vzc2lvbi5zb2NrZXQuZW1pdCgnZGF0YScsIHtkYXRhfSk7XG4gICAgICAgICAgfSlcbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICAgIC5vbignZXJyb3InLCAoZTogYW55KSA9PiB7XG4gICAgICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZXJyb3IoJ1dlYlNvY2tldCBbJWRdIGVycm9yXFxuJWonLCBzZXNzaW9uLmlkLCBlKTtcbiAgICAgICAgaWYgKGUuY29kZSA9PT0gJ0VDT05OUkVGVVNFRCcpIHtcbiAgICAgICAgICAvLyBUaGlzIGhhcHBlbnMgaW4gdGhlIGZvbGxvd2luZyBzaXR1YXRpb24gLS0gb2xkIGtlcm5lbCB0aGF0IGhhcyBnb25lXG4gICAgICAgICAgLy8gYXdheSBsaWtlbHkgZHVlIHRvIGEgcmVzdGFydC9zaHV0ZG93bi4uLiBhbmQgYW4gb2xkIG5vdGVib29rIGNsaWVudFxuICAgICAgICAgIC8vIGF0dGVtcHRzIHRvIHJlY29ubmVjdCB0byB0aGUgb2xkIGtlcm5lbC4gVGhhdCBjb25uZWN0aW9uIHdpbGwgYmVcbiAgICAgICAgICAvLyByZWZ1c2VkLiBJbiB0aGlzIGNhc2UsIHRoZXJlIGlzIG5vIHBvaW50IGluIGtlZXBpbmcgdGhpcyBzb2NrZXQuaW9cbiAgICAgICAgICAvLyBjb25uZWN0aW9uIG9wZW4uXG4gICAgICAgICAgc2Vzc2lvbi5zb2NrZXQuZGlzY29ubmVjdCgvKiBjbG9zZSAqLyB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgcmV0dXJuIHdzO1xufVxuXG4vKipcbiAqIENsb3NlcyB0aGUgV2ViU29ja2V0IGluc3RhbmNlIGFzc29jaWF0ZWQgd2l0aCB0aGUgc2Vzc2lvbi5cbiAqL1xuZnVuY3Rpb24gY2xvc2VXZWJTb2NrZXQoc2Vzc2lvbjogU2Vzc2lvbik6IHZvaWQge1xuICBpZiAoc2Vzc2lvbi53ZWJTb2NrZXQpIHtcbiAgICBzZXNzaW9uLndlYlNvY2tldC5jbG9zZSgpO1xuICAgIHNlc3Npb24ud2ViU29ja2V0ID0gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIEhhbmRsZXMgY29tbXVuaWNhdGlvbiBvdmVyIHRoZSBzcGVjaWZpZWQgc29ja2V0LlxuICovXG5mdW5jdGlvbiBzb2NrZXRIYW5kbGVyKHNvY2tldDogU29ja2V0SU8uU29ja2V0KSB7XG4gIHNlc3Npb25Db3VudGVyKys7XG5cbiAgLy8gRWFjaCBzb2NrZXQgaXMgYXNzb2NpYXRlZCB3aXRoIGEgc2Vzc2lvbiB0aGF0IHRyYWNrcyB0aGUgZm9sbG93aW5nOlxuICAvLyAtIGlkOiBhIGNvdW50ZXIgZm9yIHVzZSBpbiBsb2cgb3V0cHV0XG4gIC8vIC0gdXJsOiB0aGUgdXJsIHVzZWQgdG8gY29ubmVjdCB0byB0aGUgSnVweXRlciBzZXJ2ZXJcbiAgLy8gLSBzb2NrZXQ6IHRoZSBzb2NrZXQuaW8gc29ja2V0IHJlZmVyZW5jZSwgd2hpY2ggZ2VuZXJhdGVzIG1lc3NhZ2VcbiAgLy8gICAgICAgICAgIGV2ZW50cyBmb3IgYW55dGhpbmcgc2VudCBieSB0aGUgYnJvd3NlciBjbGllbnQsIGFuZCBhbGxvd3NcbiAgLy8gICAgICAgICAgIGVtaXR0aW5nIG1lc3NhZ2VzIHRvIHNlbmQgdG8gdGhlIGJyb3dzZXJcbiAgLy8gLSB3ZWJTb2NrZXQ6IHRoZSBjb3JyZXNwb25kaW5nIFdlYlNvY2tldCBjb25uZWN0aW9uIHRvIHRoZSBKdXB5dGVyXG4gIC8vICAgICAgICAgICAgICBzZXJ2ZXIuXG4gIC8vIFdpdGhpbiBhIHNlc3Npb24sIG1lc3NhZ2VzIHJlY2lldmVkIG92ZXIgdGhlIHNvY2tldC5pbyBzb2NrZXQgKGZyb20gdGhlXG4gIC8vIGJyb3dzZXIpIGFyZSByZWxheWVkIHRvIHRoZSBXZWJTb2NrZXQsIGFuZCBtZXNzYWdlcyByZWNpZXZlZCBvdmVyIHRoZVxuICAvLyBXZWJTb2NrZXQgc29ja2V0IGFyZSByZWxheWVkIGJhY2sgdG8gdGhlIHNvY2tldC5pbyBzb2NrZXQgKHRvIHRoZSBicm93c2VyKS5cbiAgY29uc3Qgc2Vzc2lvbjpcbiAgICAgIFNlc3Npb24gPSB7aWQ6IHNlc3Npb25Db3VudGVyLCB1cmw6ICcnLCBzb2NrZXQsIHdlYlNvY2tldDogbnVsbH07XG5cbiAgbG9nZ2luZy5nZXRMb2dnZXIoKS5kZWJ1ZygnU29ja2V0IGNvbm5lY3RlZCBmb3Igc2Vzc2lvbiAlZCcsIHNlc3Npb24uaWQpO1xuXG4gIHNvY2tldC5vbignZGlzY29ubmVjdCcsIChyZWFzb24pID0+IHtcbiAgICBsb2dnaW5nLmdldExvZ2dlcigpLmRlYnVnKFxuICAgICAgICAnU29ja2V0IGRpc2Nvbm5lY3RlZCBmb3Igc2Vzc2lvbiAlZCByZWFzb246ICVzJywgc2Vzc2lvbi5pZCwgcmVhc29uKTtcblxuICAgIC8vIEhhbmRsZSBjbGllbnQgZGlzY29ubmVjdHMgdG8gY2xvc2UgV2ViU29ja2V0cywgc28gYXMgdG8gZnJlZSB1cCByZXNvdXJjZXNcbiAgICBjbG9zZVdlYlNvY2tldChzZXNzaW9uKTtcbiAgfSk7XG5cbiAgc29ja2V0Lm9uKCdzdGFydCcsIChtZXNzYWdlOiBTZXNzaW9uTWVzc2FnZSkgPT4ge1xuICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZGVidWcoXG4gICAgICAgICdTdGFydCBpbiBzZXNzaW9uICVkIHdpdGggdXJsICVzJywgc2Vzc2lvbi5pZCwgbWVzc2FnZS51cmwpO1xuXG4gICAgdHJ5IHtcbiAgICAgIGxldCBwb3J0ID0gYXBwU2V0dGluZ3MubmV4dEp1cHl0ZXJQb3J0O1xuICAgICAgaWYgKGFwcFNldHRpbmdzLmtlcm5lbE1hbmFnZXJQcm94eVBvcnQpIHtcbiAgICAgICAgcG9ydCA9IGFwcFNldHRpbmdzLmtlcm5lbE1hbmFnZXJQcm94eVBvcnQ7XG4gICAgICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZGVidWcoJ1VzaW5nIGtlcm5lbCBtYW5hZ2VyIHByb3h5IHBvcnQgJWQnLCBwb3J0KTtcbiAgICAgIH1cbiAgICAgIGxldCBob3N0ID0gJ2xvY2FsaG9zdCc7XG4gICAgICBpZiAoYXBwU2V0dGluZ3Mua2VybmVsTWFuYWdlclByb3h5SG9zdCkge1xuICAgICAgICBob3N0ID0gYXBwU2V0dGluZ3Mua2VybmVsTWFuYWdlclByb3h5SG9zdDtcbiAgICAgIH1cbiAgICAgIHNlc3Npb24udXJsID0gbWVzc2FnZS51cmw7XG4gICAgICBzZXNzaW9uLndlYlNvY2tldCA9IGNyZWF0ZVdlYlNvY2tldChob3N0LCBwb3J0LCBzZXNzaW9uKTtcbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZXJyb3IoXG4gICAgICAgICAgZSwgJ1VuYWJsZSB0byBjcmVhdGUgV2ViU29ja2V0IGNvbm5lY3Rpb24gdG8gJXMnLCBtZXNzYWdlLnVybCk7XG4gICAgICBzZXNzaW9uLnNvY2tldC5kaXNjb25uZWN0KC8qIGNsb3NlICovIHRydWUpO1xuICAgIH1cbiAgfSk7XG5cbiAgc29ja2V0Lm9uKCdzdG9wJywgKG1lc3NhZ2U6IFNlc3Npb25NZXNzYWdlKSA9PiB7XG4gICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5kZWJ1ZyhcbiAgICAgICAgJ1N0b3AgaW4gc2Vzc2lvbiAlZCB3aXRoIHVybCAlcycsIHNlc3Npb24uaWQsIG1lc3NhZ2UudXJsKTtcblxuICAgIGNsb3NlV2ViU29ja2V0KHNlc3Npb24pO1xuICB9KTtcblxuICBzb2NrZXQub24oJ2RhdGEnLCAobWVzc2FnZTogRGF0YU1lc3NhZ2UpID0+IHtcbiAgICAvLyBQcm9wYWdhdGUgdGhlIG1lc3NhZ2Ugb3ZlciB0byB0aGUgV2ViU29ja2V0LlxuICAgIGlmIChzZXNzaW9uLndlYlNvY2tldCkge1xuICAgICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5kZWJ1ZyhcbiAgICAgICAgICAgICdTZW5kIGJpbmFyeSBkYXRhIG9mIGxlbmd0aCAlZCBpbiBzZXNzaW9uICVkLicsIG1lc3NhZ2UubGVuZ3RoLFxuICAgICAgICAgICAgc2Vzc2lvbi5pZCk7XG4gICAgICAgIHNlc3Npb24ud2ViU29ja2V0LnNlbmQobWVzc2FnZSwgKGUpID0+IHtcbiAgICAgICAgICBpZiAoZSkge1xuICAgICAgICAgICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5lcnJvcihlLCAnRmFpbGVkIHRvIHNlbmQgbWVzc2FnZSB0byB3ZWJzb2NrZXQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5kZWJ1ZyhcbiAgICAgICAgICAgICdTZW5kIGRhdGEgaW4gc2Vzc2lvbiAlZFxcbiVzJywgc2Vzc2lvbi5pZCwgbWVzc2FnZS5kYXRhKTtcbiAgICAgICAgc2Vzc2lvbi53ZWJTb2NrZXQuc2VuZChtZXNzYWdlLmRhdGEsIChlKSA9PiB7XG4gICAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZXJyb3IoZSwgJ0ZhaWxlZCB0byBzZW5kIG1lc3NhZ2UgdG8gd2Vic29ja2V0Jyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5lcnJvcihcbiAgICAgICAgICAnVW5hYmxlIHRvIHNlbmQgbWVzc2FnZTsgV2ViU29ja2V0IGlzIG5vdCBvcGVuJyk7XG4gICAgfVxuICB9KTtcbn1cblxuLyoqIEluaXRpYWxpemUgdGhlIHNvY2tldGlvIGhhbmRsZXIuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdChcbiAgICBzZXJ2ZXI6IGh0dHAuU2VydmVyLCBzZXR0aW5nczogQXBwU2V0dGluZ3MpOiBTb2NrZXRJTy5TZXJ2ZXIge1xuICBhcHBTZXR0aW5ncyA9IHNldHRpbmdzO1xuICBjb25zdCBpbyA9IHNvY2tldGlvKHNlcnZlciwge1xuICAgIHBhdGg6ICcvc29ja2V0LmlvJyxcbiAgICB0cmFuc3BvcnRzOiBbJ3BvbGxpbmcnXSxcbiAgICBhbGxvd1VwZ3JhZGVzOiBmYWxzZSxcbiAgICAvLyB2Mi4xMCBjaGFuZ2VkIGRlZmF1bHQgZnJvbSA2MHMgdG8gNXMsIHByZWZlciB0aGUgbG9uZ2VyIHRpbWVvdXQgdG9cbiAgICAvLyBhdm9pZCBlcnJhbnQgZGlzY29ubmVjdHMuXG4gICAgcGluZ1RpbWVvdXQ6IDYwMDAwLFxuICB9KTtcblxuICBpby5vZignL3Nlc3Npb24nKS5vbignY29ubmVjdGlvbicsIHNvY2tldEhhbmRsZXIpO1xuICByZXR1cm4gaW87XG59XG5cbi8qKiBSZXR1cm4gdHJ1ZSBpZmYgcGF0aCBpcyBoYW5kbGVkIGJ5IHNvY2tldC5pby4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1NvY2tldElvUGF0aChwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHBhdGguaW5kZXhPZignL3NvY2tldC5pby8nKSA9PT0gMDtcbn1cblxuXG4vKipcbiAqIEEgc2ltcGxlIHNvY2tldCBhYnN0cmFjdGlvbiB0byBzdXBwb3J0IHRyYW5zaXRpb25pbmcgZnJvbSBzb2NrZXQuaW8gdG9cbiAqIHdlYnNvY2tldC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTb2NrZXQge1xuICAvKiogU2VuZCBzdHJpbmcgZGF0YS4gU2lsZW50bHkgZHJvcHMgbWVzc2FnZXMgaWYgbm90IGNvbm5lY3RlZC4gKi9cbiAgc2VuZFN0cmluZyhkYXRhOiBzdHJpbmcpOiB2b2lkO1xuXG4gIC8qKiBTZW5kIGJpbmFyeSBkYXRhLiBTaWxlbnRseSBkcm9wcyBtZXNzYWdlcyBpZiBub3QgY29ubmVjdGVkLiAqL1xuICBzZW5kQmluYXJ5KGRhdGE6IEFycmF5QnVmZmVyKTogdm9pZDtcblxuICAvKipcbiAgICogQ2xvc2UgdGhlIHNvY2tldC5cbiAgICpcbiAgICogQHBhcmFtIGtlZXBUcmFuc3BvcnRPcGVuOiBXaGVuIHRydWUgYW5kIHRoZSB1bmRlcmx5aW5nIHRyYW5zcG9ydCBzdXBwb3J0c1xuICAgKiBtdWx0aXBsZXhpbmcgc29ja2V0IGNvbm5lY3Rpb25zLCBrZWVwIHRoYXQgdHJhbnNwb3J0IG9wZW4uXG4gICAqXG4gICAqL1xuICBjbG9zZShrZWVwVHJhbnNwb3J0T3BlbjogYm9vbGVhbik6IHZvaWQ7XG5cbiAgLyoqIExpc3RlbiBmb3Igc29ja2V0IGNsb3NlIGV2ZW50cy4gKi9cbiAgb25DbG9zZShsaXN0ZW5lcjogKHJlYXNvbjogc3RyaW5nKSA9PiB2b2lkKTogdm9pZDtcblxuICAvKiogTGlzdGVuIGZvciBzdHJpbmcgdHlwZSBkYXRhIHJlY2VpdmVkIGV2ZW50cy4gKi9cbiAgb25TdHJpbmdNZXNzYWdlKGxpc3RlbmVyOiAoZGF0YTogc3RyaW5nKSA9PiB2b2lkKTogdm9pZDtcblxuICAvKiogTGlzdGVuIGZvciBiaW5hcnkgdHlwZSBkYXRhIHJlY2VpdmVkIGV2ZW50cy4gKi9cbiAgb25CaW5hcnlNZXNzYWdlKGxpc3RlbmVyOiAoZGF0YTogQnVmZmVyKSA9PiB2b2lkKTogdm9pZDtcbn1cblxuXG4vKiogQSBiYXNlIGNsYXNzIGZvciBzb2NrZXQgY2xhc3NlcyBhZGFwdGluZyB0byB0aGUgU29ja2V0IGludGVyZmFjZS4gKi9cbmFic3RyYWN0IGNsYXNzIEFkYXB0ZXIgaW1wbGVtZW50cyBTb2NrZXQge1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgZW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuICBhYnN0cmFjdCBzZW5kU3RyaW5nKGRhdGE6IHN0cmluZyk6IHZvaWQ7XG5cbiAgYWJzdHJhY3Qgc2VuZEJpbmFyeShkYXRhOiBBcnJheUJ1ZmZlcik6IHZvaWQ7XG5cbiAgYWJzdHJhY3QgY2xvc2Uoa2VlcFRyYW5zcG9ydE9wZW46IGJvb2xlYW4pOiB2b2lkO1xuXG4gIG9uQ2xvc2UobGlzdGVuZXI6IChyZWFzb246IHN0cmluZykgPT4gdm9pZCkge1xuICAgIHRoaXMuZW1pdHRlci5vbignY2xvc2UnLCBsaXN0ZW5lcik7XG4gIH1cblxuICBvblN0cmluZ01lc3NhZ2UobGlzdGVuZXI6IChkYXRhOiBzdHJpbmcpID0+IHZvaWQpIHtcbiAgICB0aGlzLmVtaXR0ZXIub24oJ3N0cmluZ19tZXNzYWdlJywgbGlzdGVuZXIpO1xuICB9XG5cbiAgb25CaW5hcnlNZXNzYWdlKGxpc3RlbmVyOiAoZGF0YTogQnVmZmVyKSA9PiB2b2lkKSB7XG4gICAgdGhpcy5lbWl0dGVyLm9uKCdiaW5hcnlfbWVzc2FnZScsIGxpc3RlbmVyKTtcbiAgfVxufVxuXG5cbi8qKiBBIHNvY2tldCBhZGFwdGVyIGZvciBzb2NrZXQuaW8uICAqL1xuZXhwb3J0IGNsYXNzIFNvY2tldElPQWRhcHRlciBleHRlbmRzIEFkYXB0ZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHNvY2tldDogU29ja2V0SU8uU29ja2V0KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnNvY2tldC5vbignZXJyb3InLCAoZXJyKSA9PiB7XG4gICAgICBsb2dnaW5nLmdldExvZ2dlcigpLmVycm9yKGBlcnJvciBvbiBzb2NrZXQuaW86ICR7ZXJyfWApO1xuICAgICAgLy8gRXZlbnQgdW5zdXBwb3J0ZWQgaW4gU29ja2V0LlxuICAgIH0pO1xuXG4gICAgdGhpcy5zb2NrZXQub24oJ2Rpc2Nvbm5lY3RpbmcnLCAoKSA9PiB7XG4gICAgICBsb2dnaW5nLmdldExvZ2dlcigpLmVycm9yKGBkaXNjb25uZWN0aW5nIHNvY2tldC5pb2ApO1xuICAgICAgLy8gRXZlbnQgdW5zdXBwb3J0ZWQgaW4gU29ja2V0LlxuICAgIH0pO1xuXG4gICAgdGhpcy5zb2NrZXQub24oJ2Rpc2Nvbm5lY3QnLCAocmVhc29uKSA9PiB7XG4gICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnY2xvc2UnLCByZWFzb24pO1xuICAgIH0pO1xuXG4gICAgdGhpcy5zb2NrZXQub24oJ2RhdGEnLCAoZXZlbnQ6IERhdGFNZXNzYWdlfEJ1ZmZlcikgPT4ge1xuICAgICAgaWYgKGV2ZW50IGluc3RhbmNlb2YgQnVmZmVyKSB7XG4gICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdiaW5hcnlfbWVzc2FnZScsIGV2ZW50KTtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGV2ZW50LmRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRoaXMuZW1pdHRlci5lbWl0KCdzdHJpbmdfbWVzc2FnZScsIGV2ZW50LmRhdGEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2JpbmFyeV9tZXNzYWdlJywgZXZlbnQuZGF0YSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzZW5kU3RyaW5nKGRhdGE6IHN0cmluZykge1xuICAgIHRoaXMuc29ja2V0LmVtaXQoJ2RhdGEnLCB7ZGF0YX0pO1xuICB9XG5cbiAgc2VuZEJpbmFyeShkYXRhOiBBcnJheUJ1ZmZlcikge1xuICAgIHRoaXMuc29ja2V0LmVtaXQoJ2RhdGEnLCB7ZGF0YX0pO1xuICB9XG5cbiAgY2xvc2Uoa2VlcFRyYW5zcG9ydE9wZW46IGJvb2xlYW4pIHtcbiAgICB0aGlzLnNvY2tldC5kaXNjb25uZWN0KCFrZWVwVHJhbnNwb3J0T3Blbik7XG4gIH1cbn1cblxuLyoqIEEgc29ja2V0IGFkYXB0ZXIgZm9yIHdlYnNvY2tldHMuICAqL1xuZXhwb3J0IGNsYXNzIFdlYlNvY2tldEFkYXB0ZXIgZXh0ZW5kcyBBZGFwdGVyIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSB3czogd2ViU29ja2V0KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLndzLm9uKCdlcnJvcicsIChlcnIpID0+IHtcbiAgICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZXJyb3IoYHdlYnNvY2tldCBlcnJvcjogJHtlcnJ9YCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLndzLm9uKCdkaXNjb25uZWN0aW5nJywgKCkgPT4ge1xuICAgICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5lcnJvcihgZGlzY29ubmVjdGluZyB3ZWJzb2NrZXRgKTtcbiAgICAgIC8vIEV2ZW50IHVuc3VwcG9ydGVkIGluIFNvY2tldC5cbiAgICB9KTtcblxuICAgIHRoaXMud3Mub24oJ2Nsb3NlJywgKGNvZGUsIHJlYXNvbikgPT4ge1xuICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ2Nsb3NlJywgYGNvZGU6JHtjb2RlfSByZWFzb246JHtyZWFzb259YCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLndzLm9uKCdtZXNzYWdlJywgKGRhdGEpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhpcy5lbWl0dGVyLmVtaXQoJ3N0cmluZ19tZXNzYWdlJywgZGF0YSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmVtaXR0ZXIuZW1pdCgnYmluYXJ5X21lc3NhZ2UnLCBkYXRhKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHNlbmRTdHJpbmcoZGF0YTogc3RyaW5nKSB7XG4gICAgaWYgKHRoaXMud3MucmVhZHlTdGF0ZSA9PT0gd2ViU29ja2V0Lk9QRU4pIHtcbiAgICAgIHRoaXMud3Muc2VuZChkYXRhKTtcbiAgICB9XG4gIH1cblxuICBzZW5kQmluYXJ5KGRhdGE6IEFycmF5QnVmZmVyKSB7XG4gICAgaWYgKHRoaXMud3MucmVhZHlTdGF0ZSA9PT0gd2ViU29ja2V0Lk9QRU4pIHtcbiAgICAgIHRoaXMud3Muc2VuZChkYXRhKTtcbiAgICB9XG4gIH1cblxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tdW51c2VkLXZhcmlhYmxlXG4gIGNsb3NlKGtlZXBUcmFuc3BvcnRPcGVuOiBib29sZWFuKSB7XG4gICAgdGhpcy53cy5jbG9zZSgpO1xuICB9XG59XG4iXX0=