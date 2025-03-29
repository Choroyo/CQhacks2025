"use strict";
/*
 * Copyright 2020 Google Inc. All rights reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketIoToPty = void 0;
exports.WebSocketToPty = WebSocketToPty;
var nodePty = require("node-pty");
var socketio = require("socket.io");
var ws_1 = require("ws");
var logging = require("./logging");
var sockets_1 = require("./sockets");
var sessionCounter = 0;
// Inspired by
// https://xtermjs.org/docs/guides/flowcontrol/#ideas-for-a-better-mechanism.
var ACK_CALLBACK_EVERY_BYTES = 100000;
var UNACKED_HIGH_WATERMARK = 5;
var UNACKED_LOW_WATERMARK = 2;
/** Socket<->terminal adapter. */
var Session = /** @class */ (function () {
    function Session(socket) {
        var _this = this;
        this.socket = socket;
        this.pendingAckCallbacks = 0;
        this.writtenBytes = 0;
        this.id = sessionCounter++;
        this.socket.onClose(function (reason) {
            logging.getLogger().debug('PTY socket disconnected for session %d reason: %s', _this.id, reason);
            // Handle client disconnects to close sockets, so as to free up resources.
            _this.close();
        });
        this.socket.onStringMessage(function (data) {
            // Propagate the message over to the pty.
            logging.getLogger().debug('Send data in session %d\n%s', _this.id, data);
            var message = JSON.parse(data);
            if (message.data) {
                _this.pty.write(message.data);
            }
            if (message.cols && message.rows) {
                _this.pty.resize(message.cols, message.rows);
            }
            if (message.ack) {
                _this.pendingAckCallbacks--;
                if (_this.pendingAckCallbacks < UNACKED_LOW_WATERMARK) {
                    _this.pty.resume();
                }
            }
        });
        this.pty = nodePty.spawn('tmux', ['new-session', '-A', '-D', '-s', '0'], {
            name: 'xterm-color',
            cwd: './content', // Which path should terminal start
            // Pass environment variables
            env: process.env,
        });
        this.pty.onData(function (data) {
            _this.writtenBytes += data.length;
            if (_this.writtenBytes < ACK_CALLBACK_EVERY_BYTES) {
                var message = { data: data };
                _this.socket.sendString(JSON.stringify(message));
            }
            else {
                var message = { data: data, ack: true };
                _this.socket.sendString(JSON.stringify(message));
                _this.pendingAckCallbacks++;
                _this.writtenBytes = 0;
                if (_this.pendingAckCallbacks > UNACKED_HIGH_WATERMARK) {
                    _this.pty.pause();
                }
            }
        });
        this.pty.onExit(function (_a) {
            var exitCode = _a.exitCode, signal = _a.signal;
            _this.socket.close(false);
        });
    }
    Session.prototype.close = function () {
        this.socket.close(false);
        this.pty.kill();
    };
    return Session;
}());
/** SocketIO to node-pty adapter. */
var SocketIoToPty = /** @class */ (function () {
    function SocketIoToPty(path, server) {
        this.path = path;
        var io = socketio(server, {
            path: path,
            transports: ['polling'],
            allowUpgrades: false,
            // v2.10 changed default from 60s to 5s, prefer the longer timeout to
            // avoid errant disconnects.
            pingTimeout: 60000,
        });
        io.of('/').on('connection', function (socket) {
            // Session manages its own lifetime.
            // tslint:disable-next-line:no-unused-expression
            new Session(new sockets_1.SocketIOAdapter(socket));
        });
    }
    /** Return true iff path is handled by socket.io. */
    SocketIoToPty.prototype.isPathProxied = function (path) {
        return path.indexOf(this.path + '/') === 0;
    };
    return SocketIoToPty;
}());
exports.SocketIoToPty = SocketIoToPty;
/** WebSocket to pty adapter. */
function WebSocketToPty(request, sock, head) {
    new ws_1.Server({ noServer: true }).handleUpgrade(request, sock, head, function (ws) {
        // Session manages its own lifetime.
        // tslint:disable-next-line:no-unused-expression
        new Session(new sockets_1.WebSocketAdapter(ws));
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29ja2V0aW9fdG9fcHR5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vdGhpcmRfcGFydHkvY29sYWIvc291cmNlcy9zb2NrZXRpb190b19wdHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7OztHQWNHOzs7QUE4SEgsd0NBT0M7QUFqSUQsa0NBQW9DO0FBQ3BDLG9DQUFzQztBQUN0Qyx5QkFBMEI7QUFFMUIsbUNBQXFDO0FBQ3JDLHFDQUFvRTtBQVNwRSxJQUFJLGNBQWMsR0FBRyxDQUFDLENBQUM7QUFFdkIsY0FBYztBQUNkLDZFQUE2RTtBQUM3RSxJQUFNLHdCQUF3QixHQUFHLE1BQU0sQ0FBQztBQUN4QyxJQUFNLHNCQUFzQixHQUFHLENBQUMsQ0FBQztBQUNqQyxJQUFNLHFCQUFxQixHQUFHLENBQUMsQ0FBQztBQUVoQyxpQ0FBaUM7QUFDakM7SUFNRSxpQkFBNkIsTUFBYztRQUEzQyxpQkEwREM7UUExRDRCLFdBQU0sR0FBTixNQUFNLENBQVE7UUFIbkMsd0JBQW1CLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLGlCQUFZLEdBQUcsQ0FBQyxDQUFDO1FBR3ZCLElBQUksQ0FBQyxFQUFFLEdBQUcsY0FBYyxFQUFFLENBQUM7UUFFM0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBQyxNQUFNO1lBQ3pCLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxLQUFLLENBQ3JCLG1EQUFtRCxFQUFFLEtBQUksQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFMUUsMEVBQTBFO1lBQzFFLEtBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNmLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsVUFBQyxJQUFZO1lBQ3ZDLHlDQUF5QztZQUN6QyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsS0FBSyxDQUFDLDZCQUE2QixFQUFFLEtBQUks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QyxJQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFO1lBQzFCLElBQUksTUFBQTtZQUNKLFVBQVUsRUFBRSxDQUFDLFNBQVMsQ0FBQztZQUN2QixhQUFhLEVBQUUsS0FBSztZQUNwQixxRUFBcUU7WUFDckUsNEJBQTRCO1lBQzVCLFdBQVcsRUFBRSxLQUFLO1NBQ25CLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxVQUFDLE1BQXVCO1lBQ2xELG9DQUFvQztZQUNwQyxnREFBZ0Q7WUFDaEQsSUFBSSxPQUFPLENBQUMsSUFBSSx5QkFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDM0MsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsb0RBQW9EO0lBQ3BELHFDQUFhLEdBQWIsVUFBYyxJQUFZO1FBQ3hCLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBQ0gsb0JBQUM7QUFBRCxDQUFDLEFBdEJELElBc0JDO0FBdEJZLHNDQUFhO0FBeUIxQixnQ0FBZ0M7QUFDaEMsU0FBZ0IsY0FBYyxDQUMxQixPQUE2QixFQUFFLElBQWdCLEVBQUUsSUFBWTtJQUMvRCxJQUFJLFdBQU0sQ0FBQyxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxVQUFDLEVBQUU7UUFDakUsb0NBQW9DO1FBQ3BDLGdEQUFnRDtRQUNoRCxJQUFJLE9BQU8sQ0FBQyxJQUFJLDBCQUFnQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDeEMsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDIwIEdvb2dsZSBJbmMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3RcbiAqIHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mXG4gKiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVFxuICogV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiBTZWUgdGhlXG4gKiBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9ucyB1bmRlclxuICogdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIG5ldCBmcm9tICduZXQnO1xuaW1wb3J0ICogYXMgbm9kZVB0eSBmcm9tICdub2RlLXB0eSc7XG5pbXBvcnQgKiBhcyBzb2NrZXRpbyBmcm9tICdzb2NrZXQuaW8nO1xuaW1wb3J0IHtTZXJ2ZXJ9IGZyb20gJ3dzJztcblxuaW1wb3J0ICogYXMgbG9nZ2luZyBmcm9tICcuL2xvZ2dpbmcnO1xuaW1wb3J0IHtTb2NrZXQsIFNvY2tldElPQWRhcHRlciwgV2ViU29ja2V0QWRhcHRlcn0gZnJvbSAnLi9zb2NrZXRzJztcblxuXG4vLyBQYXVzZSBhbmQgcmVzdW1lIGFyZSBtaXNzaW5nIGZyb20gdGhlIHR5cGluZ3MuXG5pbnRlcmZhY2UgUHR5IHtcbiAgcGF1c2UoKTogdm9pZDtcbiAgcmVzdW1lKCk6IHZvaWQ7XG59XG5cbmxldCBzZXNzaW9uQ291bnRlciA9IDA7XG5cbi8vIEluc3BpcmVkIGJ5XG4vLyBodHRwczovL3h0ZXJtanMub3JnL2RvY3MvZ3VpZGVzL2Zsb3djb250cm9sLyNpZGVhcy1mb3ItYS1iZXR0ZXItbWVjaGFuaXNtLlxuY29uc3QgQUNLX0NBTExCQUNLX0VWRVJZX0JZVEVTID0gMTAwMDAwO1xuY29uc3QgVU5BQ0tFRF9ISUdIX1dBVEVSTUFSSyA9IDU7XG5jb25zdCBVTkFDS0VEX0xPV19XQVRFUk1BUksgPSAyO1xuXG4vKiogU29ja2V0PC0+dGVybWluYWwgYWRhcHRlci4gKi9cbmNsYXNzIFNlc3Npb24ge1xuICBwcml2YXRlIHJlYWRvbmx5IGlkOiBudW1iZXI7XG4gIHByaXZhdGUgcmVhZG9ubHkgcHR5OiBub2RlUHR5LklQdHk7XG4gIHByaXZhdGUgcGVuZGluZ0Fja0NhbGxiYWNrcyA9IDA7XG4gIHByaXZhdGUgd3JpdHRlbkJ5dGVzID0gMDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHNvY2tldDogU29ja2V0KSB7XG4gICAgdGhpcy5pZCA9IHNlc3Npb25Db3VudGVyKys7XG5cbiAgICB0aGlzLnNvY2tldC5vbkNsb3NlKChyZWFzb24pID0+IHtcbiAgICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZGVidWcoXG4gICAgICAgICAgJ1BUWSBzb2NrZXQgZGlzY29ubmVjdGVkIGZvciBzZXNzaW9uICVkIHJlYXNvbjogJXMnLCB0aGlzLmlkLCByZWFzb24pO1xuXG4gICAgICAvLyBIYW5kbGUgY2xpZW50IGRpc2Nvbm5lY3RzIHRvIGNsb3NlIHNvY2tldHMsIHNvIGFzIHRvIGZyZWUgdXAgcmVzb3VyY2VzLlxuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5zb2NrZXQub25TdHJpbmdNZXNzYWdlKChkYXRhOiBzdHJpbmcpID0+IHtcbiAgICAgIC8vIFByb3BhZ2F0ZSB0aGUgbWVzc2FnZSBvdmVyIHRvIHRoZSBwdHkuXG4gICAgICBsb2dnaW5nLmdldExvZ2dlcigpLmRlYnVnKCdTZW5kIGRhdGEgaW4gc2Vzc2lvbiAlZFxcbiVzJywgdGhpcy5pZCwgZGF0YSk7XG4gICAgICBjb25zdCBtZXNzYWdlID0gSlNPTi5wYXJzZShkYXRhKSBhcyBJbmNvbWluZ01lc3NhZ2U7XG4gICAgICBpZiAobWVzc2FnZS5kYXRhKSB7XG4gICAgICAgIHRoaXMucHR5LndyaXRlKG1lc3NhZ2UuZGF0YSk7XG4gICAgICB9XG4gICAgICBpZiAobWVzc2FnZS5jb2xzICYmIG1lc3NhZ2Uucm93cykge1xuICAgICAgICB0aGlzLnB0eS5yZXNpemUobWVzc2FnZS5jb2xzLCBtZXNzYWdlLnJvd3MpO1xuICAgICAgfVxuICAgICAgaWYgKG1lc3NhZ2UuYWNrKSB7XG4gICAgICAgIHRoaXMucGVuZGluZ0Fja0NhbGxiYWNrcy0tO1xuICAgICAgICBpZiAodGhpcy5wZW5kaW5nQWNrQ2FsbGJhY2tzIDwgVU5BQ0tFRF9MT1dfV0FURVJNQVJLKSB7XG4gICAgICAgICAgKHRoaXMucHR5IGFzIHVua25vd24gYXMgUHR5KS5yZXN1bWUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5wdHkgPSBub2RlUHR5LnNwYXduKCd0bXV4JywgWyduZXctc2Vzc2lvbicsICctQScsICctRCcsICctcycsICcwJ10sIHtcbiAgICAgIG5hbWU6ICd4dGVybS1jb2xvcicsXG4gICAgICBjd2Q6ICcuL2NvbnRlbnQnLCAgLy8gV2hpY2ggcGF0aCBzaG91bGQgdGVybWluYWwgc3RhcnRcbiAgICAgIC8vIFBhc3MgZW52aXJvbm1lbnQgdmFyaWFibGVzXG4gICAgICBlbnY6IHByb2Nlc3MuZW52IGFzIHtcbiAgICAgICAgW2tleTogc3RyaW5nXTogc3RyaW5nO1xuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMucHR5Lm9uRGF0YSgoZGF0YTogc3RyaW5nKSA9PiB7XG4gICAgICB0aGlzLndyaXR0ZW5CeXRlcyArPSBkYXRhLmxlbmd0aDtcbiAgICAgIGlmICh0aGlzLndyaXR0ZW5CeXRlcyA8IEFDS19DQUxMQkFDS19FVkVSWV9CWVRFUykge1xuICAgICAgICBjb25zdCBtZXNzYWdlOiBPdXRnb2luZ01lc3NhZ2UgPSB7ZGF0YX07XG4gICAgICAgIHRoaXMuc29ja2V0LnNlbmRTdHJpbmcoSlNPTi5zdHJpbmdpZnkobWVzc2FnZSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZTogT3V0Z29pbmdNZXNzYWdlID0ge2RhdGEsIGFjazogdHJ1ZX07XG4gICAgICAgIHRoaXMuc29ja2V0LnNlbmRTdHJpbmcoSlNPTi5zdHJpbmdpZnkobWVzc2FnZSkpO1xuICAgICAgICB0aGlzLnBlbmRpbmdBY2tDYWxsYmFja3MrKztcbiAgICAgICAgdGhpcy53cml0dGVuQnl0ZXMgPSAwO1xuICAgICAgICBpZiAodGhpcy5wZW5kaW5nQWNrQ2FsbGJhY2tzID4gVU5BQ0tFRF9ISUdIX1dBVEVSTUFSSykge1xuICAgICAgICAgICh0aGlzLnB0eSBhcyB1bmtub3duIGFzIFB0eSkucGF1c2UoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5wdHkub25FeGl0KFxuICAgICAgICAoe2V4aXRDb2RlLCBzaWduYWx9OiB7ZXhpdENvZGU6IG51bWJlciwgc2lnbmFsPzogbnVtYmVyfSkgPT4ge1xuICAgICAgICAgIHRoaXMuc29ja2V0LmNsb3NlKGZhbHNlKTtcbiAgICAgICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGNsb3NlKCkge1xuICAgIHRoaXMuc29ja2V0LmNsb3NlKGZhbHNlKTtcbiAgICB0aGlzLnB0eS5raWxsKCk7XG4gIH1cbn1cblxuLyoqIFNvY2tldElPIHRvIG5vZGUtcHR5IGFkYXB0ZXIuICovXG5leHBvcnQgY2xhc3MgU29ja2V0SW9Ub1B0eSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgcGF0aDogc3RyaW5nLCBzZXJ2ZXI6IGh0dHAuU2VydmVyKSB7XG4gICAgY29uc3QgaW8gPSBzb2NrZXRpbyhzZXJ2ZXIsIHtcbiAgICAgIHBhdGgsXG4gICAgICB0cmFuc3BvcnRzOiBbJ3BvbGxpbmcnXSxcbiAgICAgIGFsbG93VXBncmFkZXM6IGZhbHNlLFxuICAgICAgLy8gdjIuMTAgY2hhbmdlZCBkZWZhdWx0IGZyb20gNjBzIHRvIDVzLCBwcmVmZXIgdGhlIGxvbmdlciB0aW1lb3V0IHRvXG4gICAgICAvLyBhdm9pZCBlcnJhbnQgZGlzY29ubmVjdHMuXG4gICAgICBwaW5nVGltZW91dDogNjAwMDAsXG4gICAgfSk7XG5cbiAgICBpby5vZignLycpLm9uKCdjb25uZWN0aW9uJywgKHNvY2tldDogU29ja2V0SU8uU29ja2V0KSA9PiB7XG4gICAgICAvLyBTZXNzaW9uIG1hbmFnZXMgaXRzIG93biBsaWZldGltZS5cbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby11bnVzZWQtZXhwcmVzc2lvblxuICAgICAgbmV3IFNlc3Npb24obmV3IFNvY2tldElPQWRhcHRlcihzb2NrZXQpKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBSZXR1cm4gdHJ1ZSBpZmYgcGF0aCBpcyBoYW5kbGVkIGJ5IHNvY2tldC5pby4gKi9cbiAgaXNQYXRoUHJveGllZChwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gcGF0aC5pbmRleE9mKHRoaXMucGF0aCArICcvJykgPT09IDA7XG4gIH1cbn1cblxuXG4vKiogV2ViU29ja2V0IHRvIHB0eSBhZGFwdGVyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIFdlYlNvY2tldFRvUHR5KFxuICAgIHJlcXVlc3Q6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCBzb2NrOiBuZXQuU29ja2V0LCBoZWFkOiBCdWZmZXIpIHtcbiAgbmV3IFNlcnZlcih7bm9TZXJ2ZXI6IHRydWV9KS5oYW5kbGVVcGdyYWRlKHJlcXVlc3QsIHNvY2ssIGhlYWQsICh3cykgPT4ge1xuICAgIC8vIFNlc3Npb24gbWFuYWdlcyBpdHMgb3duIGxpZmV0aW1lLlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby11bnVzZWQtZXhwcmVzc2lvblxuICAgIG5ldyBTZXNzaW9uKG5ldyBXZWJTb2NrZXRBZGFwdGVyKHdzKSk7XG4gIH0pO1xufVxuXG5kZWNsYXJlIGludGVyZmFjZSBJbmNvbWluZ01lc3NhZ2Uge1xuICByZWFkb25seSBkYXRhPzogc3RyaW5nO1xuICByZWFkb25seSBjb2xzPzogbnVtYmVyO1xuICByZWFkb25seSByb3dzPzogbnVtYmVyO1xuICByZWFkb25seSBhY2s/OiBib29sZWFuO1xufVxuXG5kZWNsYXJlIGludGVyZmFjZSBPdXRnb2luZ01lc3NhZ2Uge1xuICByZWFkb25seSBkYXRhPzogc3RyaW5nO1xuICByZWFkb25seSBhY2s/OiBib29sZWFuO1xufVxuIl19