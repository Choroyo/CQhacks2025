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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketIOToLsp = void 0;
exports.WebSocketToLsp = WebSocketToLsp;
var bunyan = require("bunyan");
var childProcess = require("child_process");
var crypto_1 = require("crypto");
var fs = require("fs");
var os = require("os");
var path = require("path");
var ws_1 = require("ws");
var jsonRpc = require("./json_rpc");
var logging = require("./logging");
var protocol = require("./lsp/protocol_node");
var sockets_1 = require("./sockets");
// We import the bunyan-rotating-file-stream package, which exports a
// constructor as a single object; we use lint disables here to make the usage
// below look reasonable.
//
// tslint:disable-next-line:no-require-imports variable-name enforce-name-casing
var RotatingFileStream = require('bunyan-rotating-file-stream');
var sessionCounter = 0;
var activeCount = 0;
/** Socket<->pyright LSP. */
var Session = /** @class */ (function () {
    function Session(socket, rootDirectory, contentDirectory, logsDir, pipLogsDir, proxyBinaryPath, proxyBinaryArgs) {
        var _this = this;
        this.socket = socket;
        this.closed = false;
        this.id = sessionCounter++;
        ++activeCount;
        var logPath = path.join(logsDir, "/lsp.".concat(sessionCounter, ".log"));
        this.consoleLogger = logging.getLogger();
        this.consoleLogger.info("LSP ".concat(this.id, " new session, ").concat(activeCount, " now active"));
        this.lspLogger = bunyan.createLogger({
            name: 'lsp',
            streams: [{
                    level: 'info',
                    stream: new RotatingFileStream({
                        path: logPath,
                        rotateExisting: false,
                        threshold: '2m',
                        totalSize: '20m'
                    }),
                }],
        });
        delete this.lspLogger.fields['hostname'];
        delete this.lspLogger.fields['name'];
        this.cancellation = new FileBasedCancellation(this.lspLogger);
        // To test against locally built versions of Pyright see the docs:
        // https://github.com/microsoft/pyright/blob/main/docs/build-debug.md
        //
        // You'll want to change the path to point to your local Pyright code e.g.
        // ${HOME}/pyright/packages/pyright/langserver.index.js
        //
        // Then from within the Pyright root folder rebuild the sources with:
        // npm run build:cli:dev
        var processName = 'node';
        var processArgs = [
            path.join(contentDirectory, '..', 'datalab', 'web', 'pyright', 'pyright-langserver.js'),
            // Using stdin/stdout for passing messages.
            '--stdio',
            // Use file-based cancellation to allow background analysis.
            "--cancellationReceive=file:".concat(this.cancellation.folderName),
        ];
        if (proxyBinaryPath) {
            processArgs.unshift(processName);
            processArgs.unshift('--');
            if (proxyBinaryArgs) {
                processArgs.unshift.apply(processArgs, __spreadArray([], __read(proxyBinaryArgs), false));
            }
            processName = proxyBinaryPath;
        }
        this.pyright = childProcess.spawn(processName, processArgs, {
            stdio: ['pipe'],
            cwd: rootDirectory,
        });
        fs.writeFile("/proc/".concat(this.pyright.pid, "/oom_score_adj"), '1000', function (error) {
            if (error) {
                _this.consoleLogger.error(error, "LSP set oom_score_adj");
                return;
            }
        });
        var rpc = new jsonRpc.JsonRpcReader(function (message) {
            if (!_this.processLanguageServerMessage(message.content)) {
                _this.lspLogger.info('c<--s' + message.content);
                _this.socket.sendString(message.content);
            }
            else {
                _this.lspLogger.info(' <--s' + message.content);
            }
        });
        var encoder = new TextEncoder();
        this.pyright.stdout.on('data', function (data) {
            if (_this.closed) {
                return;
            }
            try {
                rpc.append(encoder.encode(data));
            }
            catch (error) {
                _this.consoleLogger.error("LSP ".concat(_this.id, " error handling pyright data: ").concat(error));
            }
        });
        this.pyright.stderr.on('data', function (data) {
            var out = data.toString().replace(/\n$/, '');
            _this.consoleLogger.error("LSP ".concat(_this.id, " pyright error console: ").concat(out));
        });
        this.pyright.on('error', function (data) {
            _this.consoleLogger.error("LSP ".concat(_this.id, " pyright error: ").concat(data));
            _this.close();
        });
        this.socket.onClose(function (reason) {
            _this.consoleLogger.debug("LSP ".concat(_this.id, " Socket disconnected for reason: \"%s\""), reason);
            // Handle client disconnects to close sockets, so as to free up resources.
            _this.close();
        });
        this.socket.onStringMessage(function (data) {
            if (_this.closed) {
                return;
            }
            _this.handleDataFromClient(data);
        });
        try {
            this.pipLogWatcher = fs.watch(pipLogsDir, {
                recursive: false,
            }, function (event, filename) {
                if (filename === 'pip.log') {
                    _this.pipLogChanged();
                }
            });
        }
        catch (error) {
            this.consoleLogger.error("LSP ".concat(this.id, " Error starting pip.log watcher: %s"), error);
        }
    }
    Session.prototype.handleDataFromClient = function (data) {
        if (this.closed) {
            return;
        }
        try {
            this.lspLogger.info('c-->s' + data);
            // tslint:disable-next-line:no-any
            var message = JSON.parse(data);
            if (message.method === 'initialize') {
                // Patch the processId to be this one since the client does not does
                // not know about this process ID.
                message.params.processId = process.pid;
            }
            var json = JSON.stringify(message);
            json = json.replace(/[\u007F-\uFFFF]/g, function (chr) {
                // Replace non-ASCII characters with unicode encodings to avoid issues
                // sending unicode characters through stdin.
                // We don't need to handle surrogate pairs as these won't be a single
                // character in the JSON.
                return '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).substr(-4);
            });
            this.pyright.stdin.write(jsonRpc.encodeJsonRpc(json));
        }
        catch (error) {
            // Errors propagated from here will disconnect the kernel.
            this.consoleLogger.error("LSP ".concat(this.id, " Socket error writing %s"), String(error));
            this.close();
        }
    };
    /** @return True if the message is consumed and should not be forwarded. */
    Session.prototype.processLanguageServerMessage = function (data) {
        try {
            var message = JSON.parse(data);
            if ('id' in message) {
                if ('method' in message && 'params' in message) {
                    this.handleRequest(message);
                }
                else {
                    this.handleResponse(message);
                }
            }
            else {
                return this.handleNotification(message);
            }
        }
        catch (error) {
            this.consoleLogger.error("LSP ".concat(this.id, " Error processing message: %s from \"%s\""), error, data);
        }
        return false;
    };
    /** @return True if the message is consumed and should not be forwarded. */
    Session.prototype.handleNotification = function (notification) {
        if (notification.method === protocol.Method.CancelRequest) {
            var cancellation = notification;
            this.cancellation.cancel(cancellation.params.id);
        }
        else if (notification.method === 'pyright/beginProgress' ||
            notification.method === 'pyright/reportProgress' ||
            notification.method === 'pyright/endProgress') {
            // Colab doesn't use these progress messages right now and they just
            // congest socket.io during completion flows.
            return true;
        }
        return false;
    };
    Session.prototype.handleRequest = function (request) {
        // Nothing to do here yet.
    };
    Session.prototype.handleResponse = function (response) {
        if (response.error &&
            response.error.code === protocol.ErrorCode.RequestCancelled &&
            response.id) {
            this.cancellation.cleanup(response.id);
        }
    };
    Session.prototype.pipLogChanged = function () {
        this.sendNotificationToClient(protocol.Method.ColabPipLogChanged, {});
    };
    Session.prototype.sendNotificationToClient = function (method, params) {
        if (this.closed) {
            return;
        }
        var json = {
            method: method,
            params: params,
            jsonrpc: '2.0',
        };
        var data = JSON.stringify(json);
        this.lspLogger.info('c<--s' + data);
        this.socket.sendString(data);
    };
    Session.prototype.close = function () {
        if (this.closed) {
            return;
        }
        this.closed = true;
        this.socket.close(true);
        // Force-kill pyright process to ensure full shutdown.
        // The process should effectively be read-only where it does not generate
        // any data other than what is sent back to this process.
        this.pyright.kill(9);
        if (this.pipLogWatcher) {
            this.pipLogWatcher.close();
        }
        this.cancellation.dispose();
        --activeCount;
        this.consoleLogger.info("LSP ".concat(this.id, " closed session, ").concat(activeCount, " remaining active"));
    };
    return Session;
}());
/** SocketIO to PyRight adapter. */
var SocketIOToLsp = /** @class */ (function () {
    function SocketIOToLsp(server, rootDirectory, contentDirectory, logsDir, pipLogsDir, languageServerProxy, languageServerProxyArgs) {
        // Cast to string is because the typings are missing the regexp override.
        // Documented in https://socket.io/docs/v2/namespaces/.
        server.of(new RegExp('/python-lsp/.*'))
            .on('connection', function (socket) {
            var proxyBinaryPath;
            var proxyBinaryArgs;
            if (languageServerProxy) {
                proxyBinaryPath = languageServerProxy;
                proxyBinaryArgs = languageServerProxyArgs;
            }
            // Session manages its own lifetime.
            // tslint:disable-next-line:no-unused-expression
            new Session(new sockets_1.SocketIOAdapter(socket), rootDirectory, contentDirectory, logsDir, pipLogsDir, proxyBinaryPath, proxyBinaryArgs);
        });
    }
    return SocketIOToLsp;
}());
exports.SocketIOToLsp = SocketIOToLsp;
var FileBasedCancellation = /** @class */ (function () {
    function FileBasedCancellation(logger) {
        this.logger = logger;
        this.folderName = (0, crypto_1.randomBytes)(21).toString('hex');
        // This must match the naming used in:
        // https://github.com/microsoft/pyright/blob/7bb059ecbab5c0c446d4dcf5376fc5ce8bd8cd26/packages/pyright-internal/src/common/cancellationUtils.ts#L189
        this.folderPath = path.join(os.tmpdir(), 'python-languageserver-cancellation', this.folderName);
        fs.mkdirSync(this.folderPath, { recursive: true });
    }
    FileBasedCancellation.prototype.cancel = function (id) {
        var _this = this;
        fs.promises.writeFile(this.getCancellationPath(id), '', { flag: 'w' })
            .catch(function (error) {
            _this.logger.error(error, "LSP FileBasedCancellation.cancel");
        });
    };
    FileBasedCancellation.prototype.cleanup = function (id) {
        var _this = this;
        fs.promises.unlink(this.getCancellationPath(id)).catch(function (error) {
            _this.logger.error(error, "LSP FileBasedCancellation.cleanup");
        });
    };
    FileBasedCancellation.prototype.dispose = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files, files_1, files_1_1, file, error_1, e_1_1, error_2;
            var e_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 13, , 14]);
                        return [4 /*yield*/, fs.promises.readdir(this.folderPath)];
                    case 1:
                        files = _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 9, 10, 11]);
                        files_1 = __values(files), files_1_1 = files_1.next();
                        _b.label = 3;
                    case 3:
                        if (!!files_1_1.done) return [3 /*break*/, 8];
                        file = files_1_1.value;
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, fs.promises.unlink(path.join(this.folderPath, file))];
                    case 5:
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        error_1 = _b.sent();
                        this.logger.error(error_1, "LSP FileBasedCancellation.dispose");
                        return [3 /*break*/, 7];
                    case 7:
                        files_1_1 = files_1.next();
                        return [3 /*break*/, 3];
                    case 8: return [3 /*break*/, 11];
                    case 9:
                        e_1_1 = _b.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 11];
                    case 10:
                        try {
                            if (files_1_1 && !files_1_1.done && (_a = files_1.return)) _a.call(files_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 11: return [4 /*yield*/, fs.promises.rmdir(this.folderPath)];
                    case 12:
                        _b.sent();
                        return [3 /*break*/, 14];
                    case 13:
                        error_2 = _b.sent();
                        this.logger.error(error_2, "LSP FileBasedCancellation.dispose");
                        return [3 /*break*/, 14];
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    FileBasedCancellation.prototype.getCancellationPath = function (id) {
        // This must match the naming used in:
        // https://github.com/microsoft/pyright/blob/7bb059ecbab5c0c446d4dcf5376fc5ce8bd8cd26/packages/pyright-internal/src/common/cancellationUtils.ts#L193
        return path.join(this.folderPath, "cancellation-".concat(id, ".tmp"));
    };
    return FileBasedCancellation;
}());
/** Websocket to PyRight adapter. */
function WebSocketToLsp(request, sock, head, rootDirectory, contentDirectory, logsDir, pipLogsDir, languageServerProxy, languageServerProxyArgs) {
    new ws_1.Server({ noServer: true }).handleUpgrade(request, sock, head, function (ws) {
        var proxyBinaryPath;
        var proxyBinaryArgs;
        if (languageServerProxy) {
            proxyBinaryPath = languageServerProxy;
            proxyBinaryArgs = languageServerProxyArgs;
        }
        // Session manages its own lifetime.
        // tslint:disable-next-line:no-unused-expression
        new Session(new sockets_1.WebSocketAdapter(ws), rootDirectory, contentDirectory, logsDir, pipLogsDir, proxyBinaryPath, proxyBinaryArgs);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHl0aG9uX2xzcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3RoaXJkX3BhcnR5L2NvbGFiL3NvdXJjZXMvcHl0aG9uX2xzcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7O0dBY0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTZXSCx3Q0FrQkM7QUE3WEQsK0JBQWlDO0FBQ2pDLDRDQUE4QztBQUM5QyxpQ0FBbUM7QUFDbkMsdUJBQXlCO0FBR3pCLHVCQUF5QjtBQUN6QiwyQkFBNkI7QUFDN0IseUJBQTBCO0FBRTFCLG9DQUFzQztBQUN0QyxtQ0FBcUM7QUFDckMsOENBQWdEO0FBQ2hELHFDQUFvRTtBQUlwRSxxRUFBcUU7QUFDckUsOEVBQThFO0FBQzlFLHlCQUF5QjtBQUN6QixFQUFFO0FBQ0YsZ0ZBQWdGO0FBQ2hGLElBQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDLENBQUM7QUFFbEUsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLElBQUksV0FBVyxHQUFHLENBQUMsQ0FBQztBQUVwQiw0QkFBNEI7QUFDNUI7SUFTRSxpQkFDcUIsTUFBYyxFQUFFLGFBQXFCLEVBQ3RELGdCQUF3QixFQUFFLE9BQWUsRUFBRSxVQUFrQixFQUM3RCxlQUF3QixFQUFFLGVBQW9DO1FBSGxFLGlCQStIQztRQTlIb0IsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQVAzQixXQUFNLEdBQUcsS0FBSyxDQUFDO1FBVXJCLElBQUksQ0FBQyxFQUFFLEdBQUcsY0FBYyxFQUFFLENBQUM7UUFDM0IsRUFBRSxXQUFXLENBQUM7UUFFZCxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxlQUFRLGNBQWMsU0FBTSxDQUFDLENBQUM7UUFDakUsSUFBSSxDQUFDLGFB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QUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxVQUFDLEVBQUU7UUFDakUsSUFBSSxlQUFpQyxDQUFDO1FBQ3RDLElBQUksZUFBbUMsQ0FBQztRQUN4QyxJQUFJLG1CQUFtQixFQUFFLENBQUM7WUFDeEIsZUFBZSxHQUFHLG1CQUFtQixDQUFDO1lBQ3RDLGVBQWUsR0FBRyx1QkFBdUIsQ0FBQztRQUM1QyxDQUFDO1FBQ0Qsb0NBQW9DO1FBQ3BDLGdEQUFnRDtRQUNoRCxJQUFJLE9BQU8sQ0FDUCxJQUFJLDBCQUFnQixDQUFDLEVBQUUsQ0FBQyxFQUFFLGFBQWEsRUFBRSxnQkFBZ0IsRUFBRSxPQUFPLEVBQ2xFLFVBQVUsRUFBRSxlQUFlLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFDcEQsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDIwIEdvb2dsZSBJbmMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3RcbiAqIHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mXG4gKiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVFxuICogV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiBTZWUgdGhlXG4gKiBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9ucyB1bmRlclxuICogdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0ICogYXMgYnVueWFuIGZyb20gJ2J1bnlhbic7XG5pbXBvcnQgKiBhcyBjaGlsZFByb2Nlc3MgZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQge3JhbmRvbUJ5dGVzfSBmcm9tICdjcnlwdG8nO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIG5ldCBmcm9tICduZXQnO1xuaW1wb3J0ICogYXMgb3MgZnJvbSAnb3MnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7U2VydmVyfSBmcm9tICd3cyc7XG5cbmltcG9ydCAqIGFzIGpzb25ScGMgZnJvbSAnLi9qc29uX3JwYyc7XG5pbXBvcnQgKiBhcyBsb2dnaW5nIGZyb20gJy4vbG9nZ2luZyc7XG5pbXBvcnQgKiBhcyBwcm90b2NvbCBmcm9tICcuL2xzcC9wcm90b2NvbF9ub2RlJztcbmltcG9ydCB7U29ja2V0LCBTb2NrZXRJT0FkYXB0ZXIsIFdlYlNvY2tldEFkYXB0ZXJ9IGZyb20gJy4vc29ja2V0cyc7XG5cblxuXG4vLyBXZSBpbXBvcnQgdGhlIGJ1bnlhbi1yb3RhdGluZy1maWxlLXN0cmVhbSBwYWNrYWdlLCB3aGljaCBleHBvcnRzIGFcbi8vIGNvbnN0cnVjdG9yIGFzIGEgc2luZ2xlIG9iamVjdDsgd2UgdXNlIGxpbnQgZGlzYWJsZXMgaGVyZSB0byBtYWtlIHRoZSB1c2FnZVxuLy8gYmVsb3cgbG9vayByZWFzb25hYmxlLlxuLy9cbi8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1yZXF1aXJlLWltcG9ydHMgdmFyaWFibGUtbmFtZSBlbmZvcmNlLW5hbWUtY2FzaW5nXG5jb25zdCBSb3RhdGluZ0ZpbGVTdHJlYW0gPSByZXF1aXJlKCdidW55YW4tcm90YXRpbmctZmlsZS1zdHJlYW0nKTtcblxubGV0IHNlc3Npb25Db3VudGVyID0gMDtcbmxldCBhY3RpdmVDb3VudCA9IDA7XG5cbi8qKiBTb2NrZXQ8LT5weXJpZ2h0IExTUC4gKi9cbmNsYXNzIFNlc3Npb24ge1xuICBwcml2YXRlIHJlYWRvbmx5IGlkOiBudW1iZXI7XG4gIHByaXZhdGUgcmVhZG9ubHkgcHlyaWdodDogY2hpbGRQcm9jZXNzLkNoaWxkUHJvY2VzcztcbiAgcHJpdmF0ZSBjbG9zZWQgPSBmYWxzZTtcbiAgcHJpdmF0ZSByZWFkb25seSBsc3BMb2dnZXI6IGJ1bnlhbi5JTG9nZ2VyO1xuICBwcml2YXRlIHJlYWRvbmx5IGNvbnNvbGVMb2dnZXI6IGJ1bnlhbi5JTG9nZ2VyO1xuICBwcml2YXRlIHJlYWRvbmx5IHBpcExvZ1dhdGNoZXI/OiBmcy5GU1dhdGNoZXI7XG4gIHByaXZhdGUgcmVhZG9ubHkgY2FuY2VsbGF0aW9uOiBGaWxlQmFzZWRDYW5jZWxsYXRpb247XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIHJlYWRvbmx5IHNvY2tldDogU29ja2V0LCByb290RGlyZWN0b3J5OiBzdHJpbmcsXG4gICAgICBjb250ZW50RGlyZWN0b3J5OiBzdHJpbmcsIGxvZ3NEaXI6IHN0cmluZywgcGlwTG9nc0Rpcjogc3RyaW5nLFxuICAgICAgcHJveHlCaW5hcnlQYXRoPzogc3RyaW5nLCBwcm94eUJpbmFyeUFyZ3M/OiBzdHJpbmdbXXx1bmRlZmluZWQpIHtcbiAgICB0aGlzLmlkID0gc2Vzc2lvbkNvdW50ZXIrKztcbiAgICArK2FjdGl2ZUNvdW50O1xuXG4gICAgY29uc3QgbG9nUGF0aCA9IHBhdGguam9pbihsb2dzRGlyLCBgL2xzcC4ke3Nlc3Npb25Db3VudGVyfS5sb2dgKTtcbiAgICB0aGlzLmNvbnNvbGVMb2dnZXIgPSBsb2dnaW5nLmdldExvZ2dlcigpO1xuICAgIHRoaXMuY29uc29sZUxvZ2dlci5pbmZvKFxuICAgICAgICBgTFNQICR7dGhpcy5pZH0gbmV3IHNlc3Npb24sICR7YWN0aXZlQ291bnR9IG5vdyBhY3RpdmVgKTtcblxuICAgIHRoaXMubHNwTG9nZ2VyID0gYnVueWFuLmNyZWF0ZUxvZ2dlcih7XG4gICAgICBuYW1lOiAnbHNwJyxcbiAgICAgIHN0cmVhbXM6IFt7XG4gICAgICAgIGxldmVsOiAnaW5mbycsXG4gICAgICAgIHN0cmVhbTogbmV3IFJvdGF0aW5nRmlsZVN0cmVhbSh7XG4gICAgICAgICAgcGF0aDogbG9nUGF0aCxcbiAgICAgICAgICByb3RhdGVFeGlzdGluZzogZmFsc2UsXG4gICAgICAgICAgdGhyZXNob2xkOiAnMm0nLFxuICAgICAgICAgIHRvdGFsU2l6ZTogJzIwbSdcbiAgICAgICAgfSksXG4gICAgICB9XSxcbiAgICB9KTtcbiAgICBkZWxldGUgdGhpcy5sc3BMb2dnZXIuZmllbGRzWydob3N0bmFtZSddO1xuICAgIGRlbGV0ZSB0aGlzLmxzcExvZ2dlci5maWVsZHNbJ25hbWUnXTtcbiAgICB0aGlzLmNhbmNlbGxhdGlvbiA9IG5ldyBGaWxlQmFzZWRDYW5jZWxsYXRpb24odGhpcy5sc3BMb2dnZXIpO1xuXG4gICAgLy8gVG8gdGVzdCBhZ2FpbnN0IGxvY2FsbHkgYnVpbHQgdmVyc2lvbnMgb2YgUHlyaWdodCBzZWUgdGhlIGRvY3M6XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9weXJpZ2h0L2Jsb2IvbWFpbi9kb2NzL2J1aWxkLWRlYnVnLm1kXG4gICAgLy9cbiAgICAvLyBZb3UnbGwgd2FudCB0byBjaGFuZ2UgdGhlIHBhdGggdG8gcG9pbnQgdG8geW91ciBsb2NhbCBQeXJpZ2h0IGNvZGUgZS5nLlxuICAgIC8vICR7SE9NRX0vcHlyaWdodC9wYWNrYWdlcy9weXJpZ2h0L2xhbmdzZXJ2ZXIuaW5kZXguanNcbiAgICAvL1xuICAgIC8vIFRoZW4gZnJvbSB3aXRoaW4gdGhlIFB5cmlnaHQgcm9vdCBmb2xkZXIgcmVidWlsZCB0aGUgc291cmNlcyB3aXRoOlxuICAgIC8vIG5wbSBydW4gYnVpbGQ6Y2xpOmRldlxuICAgIGxldCBwcm9jZXNzTmFtZSA9ICdub2RlJztcbiAgICBjb25zdCBwcm9jZXNzQXJncyA9IFtcbiAgICAgIHBhdGguam9pbihcbiAgICAgICAgICBjb250ZW50RGlyZWN0b3J5LCAnLi4nLCAnZGF0YWxhYicsICd3ZWInLCAncHlyaWdodCcsXG4gICAgICAgICAgJ3B5cmlnaHQtbGFuZ3NlcnZlci5qcycpLFxuICAgICAgLy8gVXNpbmcgc3RkaW4vc3Rkb3V0IGZvciBwYXNzaW5nIG1lc3NhZ2VzLlxuICAgICAgJy0tc3RkaW8nLFxuICAgICAgLy8gVXNlIGZpbGUtYmFzZWQgY2FuY2VsbGF0aW9uIHRvIGFsbG93IGJhY2tncm91bmQgYW5hbHlzaXMuXG4gICAgICBgLS1jYW5jZWxsYXRpb25SZWNlaXZlPWZpbGU6JHt0aGlzLmNhbmNlbGxhdGlvbi5mb2xkZXJOYW1lfWAsXG4gICAgXTtcblxuICAgIGlmIChwcm94eUJpbmFyeVBhdGgpIHtcbiAgICAgIHByb2Nlc3NBcmdzLnVuc2hpZnQocHJvY2Vzc05hbWUpO1xuICAgICAgcHJvY2Vzc0FyZ3MudW5zaGlmdCgnLS0nKTtcbiAgICAgIGlmIChwcm94eUJpbmFyeUFyZ3MpIHtcbiAgICAgICAgcHJvY2Vzc0FyZ3MudW5zaGlmdCguLi5wcm94eUJpbmFyeUFyZ3MpO1xuICAgICAgfVxuICAgICAgcHJvY2Vzc05hbWUgPSBwcm94eUJpbmFyeVBhdGg7XG4gICAgfVxuXG4gICAgdGhpcy5weXJpZ2h0ID0gY2hpbGRQcm9jZXNzLnNwYXduKHByb2Nlc3NOYW1lLCBwcm9jZXNzQXJncywge1xuICAgICAgc3RkaW86IFsncGlwZSddLFxuICAgICAgY3dkOiByb290RGlyZWN0b3J5LFxuICAgIH0pO1xuICAgIGZzLndyaXRlRmlsZShgL3Byb2MvJHt0aGlzLnB5cmlnaHQucGlkfS9vb21fc2NvcmVfYWRqYCwgJzEwMDAnLCAoZXJyb3IpID0+IHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICB0aGlzLmNvbnNvbGVMb2dnZXIuZXJyb3IoZXJyb3IgYXMgRXJyb3IsIGBMU1Agc2V0IG9vbV9zY29yZV9hZGpgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgcnBjID0gbmV3IGpzb25ScGMuSnNvblJwY1JlYWRlcigobWVzc2FnZSkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnByb2Nlc3NMYW5ndWFnZVNlcnZlck1lc3NhZ2UobWVzc2FnZS5jb250ZW50KSkge1xuICAgICAgICB0aGlzLmxzcExvZ2dlci5pbmZvKCdjPC0tcycgKyBtZXNzYWdlLmNvbnRlbnQpO1xuICAgICAgICB0aGlzLnNvY2tldC5zZW5kU3RyaW5nKG1lc3NhZ2UuY29udGVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxzcExvZ2dlci5pbmZvKCcgPC0tcycgKyBtZXNzYWdlLmNvbnRlbnQpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICAgIHRoaXMucHlyaWdodC5zdGRvdXQhLm9uKCdkYXRhJywgKGRhdGE6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKHRoaXMuY2xvc2VkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIHJwYy5hcHBlbmQoZW5jb2Rlci5lbmNvZGUoZGF0YSkpO1xuICAgICAgfSBjYXRjaCAoZXJyb3I6IHVua25vd24pIHtcbiAgICAgICAgdGhpcy5jb25zb2xlTG9nZ2VyLmVycm9yKFxuICAgICAgICAgICAgYExTUCAke3RoaXMuaWR9IGVycm9yIGhhbmRsaW5nIHB5cmlnaHQgZGF0YTogJHtlcnJvcn1gKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB0aGlzLnB5cmlnaHQuc3RkZXJyIS5vbignZGF0YScsIChkYXRhOiBCdWZmZXIpID0+IHtcbiAgICAgIGNvbnN0IG91dCA9IGRhdGEudG9TdHJpbmcoKS5yZXBsYWNlKC9cXG4kLywgJycpO1xuICAgICAgdGhpcy5jb25zb2xlTG9nZ2VyLmVycm9yKGBMU1AgJHt0aGlzLmlkfSBweXJpZ2h0IGVycm9yIGNvbnNvbGU6ICR7b3V0fWApO1xuICAgIH0pO1xuXG4gICAgdGhpcy5weXJpZ2h0Lm9uKCdlcnJvcicsIChkYXRhOiBzdHJpbmcpID0+IHtcbiAgICAgIHRoaXMuY29uc29sZUxvZ2dlci5lcnJvcihgTFNQICR7dGhpcy5pZH0gcHlyaWdodCBlcnJvcjogJHtkYXRhfWApO1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5zb2NrZXQub25DbG9zZSgocmVhc29uKSA9PiB7XG4gICAgICB0aGlzLmNvbnNvbGVMb2dnZXIuZGVidWcoXG4gICAgICAgICAgYExTUCAke3RoaXMuaWR9IFNvY2tldCBkaXNjb25uZWN0ZWQgZm9yIHJlYXNvbjogXCIlc1wiYCwgcmVhc29uKTtcblxuICAgICAgLy8gSGFuZGxlIGNsaWVudCBkaXNjb25uZWN0cyB0byBjbG9zZSBzb2NrZXRzLCBzbyBhcyB0byBmcmVlIHVwIHJlc291cmNlcy5cbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9KTtcblxuICAgIHRoaXMuc29ja2V0Lm9uU3RyaW5nTWVzc2FnZShkYXRhID0+IHtcbiAgICAgIGlmICh0aGlzLmNsb3NlZCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0aGlzLmhhbmRsZURhdGFGcm9tQ2xpZW50KGRhdGEpO1xuICAgIH0pO1xuXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMucGlwTG9nV2F0Y2hlciA9IGZzLndhdGNoKFxuICAgICAgICAgIHBpcExvZ3NEaXIsIHtcbiAgICAgICAgICAgIHJlY3Vyc2l2ZTogZmFsc2UsXG4gICAgICAgICAgfSxcbiAgICAgICAgICAoZXZlbnQ6IHN0cmluZywgZmlsZW5hbWU6IHVua25vd24pID0+IHtcbiAgICAgICAgICAgIGlmIChmaWxlbmFtZSA9PT0gJ3BpcC5sb2cnKSB7XG4gICAgICAgICAgICAgIHRoaXMucGlwTG9nQ2hhbmdlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG4gICAgICB0aGlzLmNvbnNvbGVMb2dnZXIuZXJyb3IoXG4gICAgICAgICAgYExTUCAke3RoaXMuaWR9IEVycm9yIHN0YXJ0aW5nIHBpcC5sb2cgd2F0Y2hlcjogJXNgLCBlcnJvciBhcyB7fSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBoYW5kbGVEYXRhRnJvbUNsaWVudChkYXRhOiBzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5jbG9zZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubHNwTG9nZ2VyLmluZm8oJ2MtLT5zJyArIGRhdGEpO1xuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgICAgY29uc3QgbWVzc2FnZSA9IEpTT04ucGFyc2UoZGF0YSkgYXMgYW55O1xuICAgICAgaWYgKG1lc3NhZ2UubWV0aG9kID09PSAnaW5pdGlhbGl6ZScpIHtcbiAgICAgICAgLy8gUGF0Y2ggdGhlIHByb2Nlc3NJZCB0byBiZSB0aGlzIG9uZSBzaW5jZSB0aGUgY2xpZW50IGRvZXMgbm90IGRvZXNcbiAgICAgICAgLy8gbm90IGtub3cgYWJvdXQgdGhpcyBwcm9jZXNzIElELlxuICAgICAgICBtZXNzYWdlLnBhcmFtcy5wcm9jZXNzSWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIH1cbiAgICAgIGxldCBqc29uID0gSlNPTi5zdHJpbmdpZnkobWVzc2FnZSk7XG4gICAgICBqc29uID0ganNvbi5yZXBsYWNlKC9bXFx1MDA3Ri1cXHVGRkZGXS9nLCAoY2hyKSA9PiB7XG4gICAgICAgIC8vIFJlcGxhY2Ugbm9uLUFTQ0lJIGNoYXJhY3RlcnMgd2l0aCB1bmljb2RlIGVuY29kaW5ncyB0byBhdm9pZCBpc3N1ZXNcbiAgICAgICAgLy8gc2VuZGluZyB1bmljb2RlIGNoYXJhY3RlcnMgdGhyb3VnaCBzdGRpbi5cbiAgICAgICAgLy8gV2UgZG9uJ3QgbmVlZCB0byBoYW5kbGUgc3Vycm9nYXRlIHBhaXJzIGFzIHRoZXNlIHdvbid0IGJlIGEgc2luZ2xlXG4gICAgICAgIC8vIGNoYXJhY3RlciBpbiB0aGUgSlNPTi5cbiAgICAgICAgcmV0dXJuICdcXFxcdScgKyAoJzAwMDAnICsgY2hyLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zdWJzdHIoLTQpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLnB5cmlnaHQuc3RkaW4hLndyaXRlKGpzb25ScGMuZW5jb2RlSnNvblJwYyhqc29uKSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IHVua25vd24pIHtcbiAgICAgIC8vIEVycm9ycyBwcm9wYWdhdGVkIGZyb20gaGVyZSB3aWxsIGRpc2Nvbm5lY3QgdGhlIGtlcm5lbC5cbiAgICAgIHRoaXMuY29uc29sZUxvZ2dlci5lcnJvcihcbiAgICAgICAgICBgTFNQICR7dGhpcy5pZH0gU29ja2V0IGVycm9yIHdyaXRpbmcgJXNgLCBTdHJpbmcoZXJyb3IpKTtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9XG4gIH1cblxuICAvKiogQHJldHVybiBUcnVlIGlmIHRoZSBtZXNzYWdlIGlzIGNvbnN1bWVkIGFuZCBzaG91bGQgbm90IGJlIGZvcndhcmRlZC4gKi9cbiAgcHJpdmF0ZSBwcm9jZXNzTGFuZ3VhZ2VTZXJ2ZXJNZXNzYWdlKGRhdGE6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gSlNPTi5wYXJzZShkYXRhKSBhcyBwcm90b2NvbC5NZXNzYWdlO1xuICAgICAgaWYgKCdpZCcgaW4gbWVzc2FnZSkge1xuICAgICAgICBpZiAoJ21ldGhvZCcgaW4gbWVzc2FnZSAmJiAncGFyYW1zJyBpbiBtZXNzYWdlKSB7XG4gICAgICAgICAgdGhpcy5oYW5kbGVSZXF1ZXN0KG1lc3NhZ2UgYXMgcHJvdG9jb2wuUmVxdWVzdE1lc3NhZ2U8dW5rbm93bj4pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuaGFuZGxlUmVzcG9uc2UobWVzc2FnZSBhcyBwcm90b2NvbC5SZXNwb25zZU1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5oYW5kbGVOb3RpZmljYXRpb24oXG4gICAgICAgICAgICBtZXNzYWdlIGFzIHByb3RvY29sLk5vdGlmaWNhdGlvbk1lc3NhZ2U8dW5rbm93bj4pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiB1bmtub3duKSB7XG4gICAgICB0aGlzLmNvbnNvbGVMb2dnZXIuZXJyb3IoXG4gICAgICAgICAgYExTUCAke3RoaXMuaWR9IEVycm9yIHByb2Nlc3NpbmcgbWVzc2FnZTogJXMgZnJvbSBcIiVzXCJgLCBlcnJvciBhcyB7fSxcbiAgICAgICAgICBkYXRhKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqIEByZXR1cm4gVHJ1ZSBpZiB0aGUgbWVzc2FnZSBpcyBjb25zdW1lZCBhbmQgc2hvdWxkIG5vdCBiZSBmb3J3YXJkZWQuICovXG4gIHByaXZhdGUgaGFuZGxlTm90aWZpY2F0aW9uKFxuICAgICAgbm90aWZpY2F0aW9uOiBwcm90b2NvbC5Ob3RpZmljYXRpb25NZXNzYWdlPHVua25vd24+KTogYm9vbGVhbiB7XG4gICAgaWYgKG5vdGlmaWNhdGlvbi5tZXRob2QgPT09IHByb3RvY29sLk1ldGhvZC5DYW5jZWxSZXF1ZXN0KSB7XG4gICAgICBjb25zdCBjYW5jZWxsYXRpb24gPVxuICAgICAgICAgIG5vdGlmaWNhdGlvbiBhcyBwcm90b2NvbC5Ob3RpZmljYXRpb25NZXNzYWdlPHByb3RvY29sLkNhbmNlbFBhcmFtcz47XG4gICAgICB0aGlzLmNhbmNlbGxhdGlvbi5jYW5jZWwoY2FuY2VsbGF0aW9uLnBhcmFtcy5pZCk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgICAgbm90aWZpY2F0aW9uLm1ldGhvZCA9PT0gJ3B5cmlnaHQvYmVnaW5Qcm9ncmVzcycgfHxcbiAgICAgICAgbm90aWZpY2F0aW9uLm1ldGhvZCA9PT0gJ3B5cmlnaHQvcmVwb3J0UHJvZ3Jlc3MnIHx8XG4gICAgICAgIG5vdGlmaWNhdGlvbi5tZXRob2QgPT09ICdweXJpZ2h0L2VuZFByb2dyZXNzJykge1xuICAgICAgLy8gQ29sYWIgZG9lc24ndCB1c2UgdGhlc2UgcHJvZ3Jlc3MgbWVzc2FnZXMgcmlnaHQgbm93IGFuZCB0aGV5IGp1c3RcbiAgICAgIC8vIGNvbmdlc3Qgc29ja2V0LmlvIGR1cmluZyBjb21wbGV0aW9uIGZsb3dzLlxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGhhbmRsZVJlcXVlc3QocmVxdWVzdDogcHJvdG9jb2wuUmVxdWVzdE1lc3NhZ2U8dW5rbm93bj4pIHtcbiAgICAvLyBOb3RoaW5nIHRvIGRvIGhlcmUgeWV0LlxuICB9XG5cbiAgaGFuZGxlUmVzcG9uc2UocmVzcG9uc2U6IHByb3RvY29sLlJlc3BvbnNlTWVzc2FnZSkge1xuICAgIGlmIChyZXNwb25zZS5lcnJvciAmJlxuICAgICAgICByZXNwb25zZS5lcnJvci5jb2RlID09PSBwcm90b2NvbC5FcnJvckNvZGUuUmVxdWVzdENhbmNlbGxlZCAmJlxuICAgICAgICByZXNwb25zZS5pZCkge1xuICAgICAgdGhpcy5jYW5jZWxsYXRpb24uY2xlYW51cChyZXNwb25zZS5pZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwaXBMb2dDaGFuZ2VkKCkge1xuICAgIHRoaXMuc2VuZE5vdGlmaWNhdGlvblRvQ2xpZW50KHByb3RvY29sLk1ldGhvZC5Db2xhYlBpcExvZ0NoYW5nZWQsIHt9KTtcbiAgfVxuXG4gIHByaXZhdGUgc2VuZE5vdGlmaWNhdGlvblRvQ2xpZW50PFQ+KG1ldGhvZDogcHJvdG9jb2wuTWV0aG9kLCBwYXJhbXM6IFQpIHtcbiAgICBpZiAodGhpcy5jbG9zZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QganNvbjogcHJvdG9jb2wuTm90aWZpY2F0aW9uTWVzc2FnZTxUPiA9IHtcbiAgICAgIG1ldGhvZCxcbiAgICAgIHBhcmFtcyxcbiAgICAgIGpzb25ycGM6ICcyLjAnLFxuICAgIH07XG4gICAgY29uc3QgZGF0YSA9IEpTT04uc3RyaW5naWZ5KGpzb24pO1xuICAgIHRoaXMubHNwTG9nZ2VyLmluZm8oJ2M8LS1zJyArIGRhdGEpO1xuICAgIHRoaXMuc29ja2V0LnNlbmRTdHJpbmcoZGF0YSk7XG4gIH1cblxuICBwcml2YXRlIGNsb3NlKCkge1xuICAgIGlmICh0aGlzLmNsb3NlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLmNsb3NlZCA9IHRydWU7XG4gICAgdGhpcy5zb2NrZXQuY2xvc2UodHJ1ZSk7XG4gICAgLy8gRm9yY2Uta2lsbCBweXJpZ2h0IHByb2Nlc3MgdG8gZW5zdXJlIGZ1bGwgc2h1dGRvd24uXG4gICAgLy8gVGhlIHByb2Nlc3Mgc2hvdWxkIGVmZmVjdGl2ZWx5IGJlIHJlYWQtb25seSB3aGVyZSBpdCBkb2VzIG5vdCBnZW5lcmF0ZVxuICAgIC8vIGFueSBkYXRhIG90aGVyIHRoYW4gd2hhdCBpcyBzZW50IGJhY2sgdG8gdGhpcyBwcm9jZXNzLlxuICAgIHRoaXMucHlyaWdodC5raWxsKDkpO1xuICAgIGlmICh0aGlzLnBpcExvZ1dhdGNoZXIpIHtcbiAgICAgIHRoaXMucGlwTG9nV2F0Y2hlci5jbG9zZSgpO1xuICAgIH1cbiAgICB0aGlzLmNhbmNlbGxhdGlvbi5kaXNwb3NlKCk7XG5cbiAgICAtLWFjdGl2ZUNvdW50O1xuICAgIHRoaXMuY29uc29sZUxvZ2dlci5pbmZvKFxuICAgICAgICBgTFNQICR7dGhpcy5pZH0gY2xvc2VkIHNlc3Npb24sICR7YWN0aXZlQ291bnR9IHJlbWFpbmluZyBhY3RpdmVgKTtcbiAgfVxufVxuXG4vKiogU29ja2V0SU8gdG8gUHlSaWdodCBhZGFwdGVyLiAqL1xuZXhwb3J0IGNsYXNzIFNvY2tldElPVG9Mc3Age1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHNlcnZlcjogU29ja2V0SU8uU2VydmVyLCByb290RGlyZWN0b3J5OiBzdHJpbmcsIGNvbnRlbnREaXJlY3Rvcnk6IHN0cmluZyxcbiAgICAgIGxvZ3NEaXI6IHN0cmluZywgcGlwTG9nc0Rpcjogc3RyaW5nLCBsYW5ndWFnZVNlcnZlclByb3h5Pzogc3RyaW5nLFxuICAgICAgbGFuZ3VhZ2VTZXJ2ZXJQcm94eUFyZ3M/OiBzdHJpbmdbXSkge1xuICAgIC8vIENhc3QgdG8gc3RyaW5nIGlzIGJlY2F1c2UgdGhlIHR5cGluZ3MgYXJlIG1pc3NpbmcgdGhlIHJlZ2V4cCBvdmVycmlkZS5cbiAgICAvLyBEb2N1bWVudGVkIGluIGh0dHBzOi8vc29ja2V0LmlvL2RvY3MvdjIvbmFtZXNwYWNlcy8uXG4gICAgc2VydmVyLm9mKG5ldyBSZWdFeHAoJy9weXRob24tbHNwLy4qJykgYXMgdW5rbm93biBhcyBzdHJpbmcpXG4gICAgICAgIC5vbignY29ubmVjdGlvbicsIChzb2NrZXQ6IFNvY2tldElPLlNvY2tldCkgPT4ge1xuICAgICAgICAgIGxldCBwcm94eUJpbmFyeVBhdGg6IHN0cmluZ3x1bmRlZmluZWQ7XG4gICAgICAgICAgbGV0IHByb3h5QmluYXJ5QXJnczogc3RyaW5nW118dW5kZWZpbmVkO1xuICAgICAgICAgIGlmIChsYW5ndWFnZVNlcnZlclByb3h5KSB7XG4gICAgICAgICAgICBwcm94eUJpbmFyeVBhdGggPSBsYW5ndWFnZVNlcnZlclByb3h5O1xuICAgICAgICAgICAgcHJveHlCaW5hcnlBcmdzID0gbGFuZ3VhZ2VTZXJ2ZXJQcm94eUFyZ3M7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFNlc3Npb24gbWFuYWdlcyBpdHMgb3duIGxpZmV0aW1lLlxuICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby11bnVzZWQtZXhwcmVzc2lvblxuICAgICAgICAgIG5ldyBTZXNzaW9uKFxuICAgICAgICAgICAgICBuZXcgU29ja2V0SU9BZGFwdGVyKHNvY2tldCksIHJvb3REaXJlY3RvcnksIGNvbnRlbnREaXJlY3RvcnksXG4gICAgICAgICAgICAgIGxvZ3NEaXIsIHBpcExvZ3NEaXIsIHByb3h5QmluYXJ5UGF0aCwgcHJveHlCaW5hcnlBcmdzKTtcbiAgICAgICAgfSk7XG4gIH1cbn1cblxuY2xhc3MgRmlsZUJhc2VkQ2FuY2VsbGF0aW9uIHtcbiAgcHJpdmF0ZSByZWFkb25seSBmb2xkZXJQYXRoOiBzdHJpbmc7XG4gIHJlYWRvbmx5IGZvbGRlck5hbWU6IHN0cmluZztcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBsb2dnZXI6IGJ1bnlhbi5JTG9nZ2VyKSB7XG4gICAgdGhpcy5mb2xkZXJOYW1lID0gcmFuZG9tQnl0ZXMoMjEpLnRvU3RyaW5nKCdoZXgnKTtcbiAgICAvLyBUaGlzIG11c3QgbWF0Y2ggdGhlIG5hbWluZyB1c2VkIGluOlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvcHlyaWdodC9ibG9iLzdiYjA1OWVjYmFiNWMwYzQ0NmQ0ZGNmNTM3NmZjNWNlOGJkOGNkMjYvcGFja2FnZXMvcHlyaWdodC1pbnRlcm5hbC9zcmMvY29tbW9uL2NhbmNlbGxhdGlvblV0aWxzLnRzI0wxODlcbiAgICB0aGlzLmZvbGRlclBhdGggPSBwYXRoLmpvaW4oXG4gICAgICAgIG9zLnRtcGRpcigpLCAncHl0aG9uLWxhbmd1YWdlc2VydmVyLWNhbmNlbGxhdGlvbicsIHRoaXMuZm9sZGVyTmFtZSk7XG4gICAgZnMubWtkaXJTeW5jKHRoaXMuZm9sZGVyUGF0aCwge3JlY3Vyc2l2ZTogdHJ1ZX0pO1xuICB9XG5cbiAgY2FuY2VsKGlkOiBzdHJpbmd8bnVtYmVyKSB7XG4gICAgZnMucHJvbWlzZXMud3JpdGVGaWxlKHRoaXMuZ2V0Q2FuY2VsbGF0aW9uUGF0aChpZCksICcnLCB7ZmxhZzogJ3cnfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcjogdW5rbm93bikgPT4ge1xuICAgICAgICAgIHRoaXMubG9nZ2VyLmVycm9yKGVycm9yIGFzIEVycm9yLCBgTFNQIEZpbGVCYXNlZENhbmNlbGxhdGlvbi5jYW5jZWxgKTtcbiAgICAgICAgfSk7XG4gIH1cblxuICBjbGVhbnVwKGlkOiBzdHJpbmd8bnVtYmVyKSB7XG4gICAgZnMucHJvbWlzZXMudW5saW5rKHRoaXMuZ2V0Q2FuY2VsbGF0aW9uUGF0aChpZCkpLmNhdGNoKChlcnJvcjogdW5rbm93bikgPT4ge1xuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoZXJyb3IgYXMgRXJyb3IsIGBMU1AgRmlsZUJhc2VkQ2FuY2VsbGF0aW9uLmNsZWFudXBgKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGRpc3Bvc2UoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGZpbGVzID0gYXdhaXQgZnMucHJvbWlzZXMucmVhZGRpcih0aGlzLmZvbGRlclBhdGgpO1xuICAgICAgZm9yIChjb25zdCBmaWxlIG9mIGZpbGVzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgZnMucHJvbWlzZXMudW5saW5rKHBhdGguam9pbih0aGlzLmZvbGRlclBhdGgsIGZpbGUpKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3I6IHVua25vd24pIHtcbiAgICAgICAgICB0aGlzLmxvZ2dlci5lcnJvcihcbiAgICAgICAgICAgICAgZXJyb3IgYXMgRXJyb3IsIGBMU1AgRmlsZUJhc2VkQ2FuY2VsbGF0aW9uLmRpc3Bvc2VgKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYXdhaXQgZnMucHJvbWlzZXMucm1kaXIodGhpcy5mb2xkZXJQYXRoKTtcbiAgICB9IGNhdGNoIChlcnJvcjogdW5rbm93bikge1xuICAgICAgdGhpcy5sb2dnZXIuZXJyb3IoZXJyb3IgYXMgRXJyb3IsIGBMU1AgRmlsZUJhc2VkQ2FuY2VsbGF0aW9uLmRpc3Bvc2VgKTtcbiAgICB9XG4gIH1cblxuICBnZXRDYW5jZWxsYXRpb25QYXRoKGlkOiBzdHJpbmd8bnVtYmVyKTogc3RyaW5nIHtcbiAgICAvLyBUaGlzIG11c3QgbWF0Y2ggdGhlIG5hbWluZyB1c2VkIGluOlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvcHlyaWdodC9ibG9iLzdiYjA1OWVjYmFiNWMwYzQ0NmQ0ZGNmNTM3NmZjNWNlOGJkOGNkMjYvcGFja2FnZXMvcHlyaWdodC1pbnRlcm5hbC9zcmMvY29tbW9uL2NhbmNlbGxhdGlvblV0aWxzLnRzI0wxOTNcbiAgICByZXR1cm4gcGF0aC5qb2luKHRoaXMuZm9sZGVyUGF0aCwgYGNhbmNlbGxhdGlvbi0ke2lkfS50bXBgKTtcbiAgfVxufVxuXG5cbi8qKiBXZWJzb2NrZXQgdG8gUHlSaWdodCBhZGFwdGVyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIFdlYlNvY2tldFRvTHNwKFxuICAgIHJlcXVlc3Q6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCBzb2NrOiBuZXQuU29ja2V0LCBoZWFkOiBCdWZmZXIsXG4gICAgcm9vdERpcmVjdG9yeTogc3RyaW5nLCBjb250ZW50RGlyZWN0b3J5OiBzdHJpbmcsIGxvZ3NEaXI6IHN0cmluZyxcbiAgICBwaXBMb2dzRGlyOiBzdHJpbmcsIGxhbmd1YWdlU2VydmVyUHJveHk/OiBzdHJpbmcsXG4gICAgbGFuZ3VhZ2VTZXJ2ZXJQcm94eUFyZ3M/OiBzdHJpbmdbXSkge1xuICBuZXcgU2VydmVyKHtub1NlcnZlcjogdHJ1ZX0pLmhhbmRsZVVwZ3JhZGUocmVxdWVzdCwgc29jaywgaGVhZCwgKHdzKSA9PiB7XG4gICAgbGV0IHByb3h5QmluYXJ5UGF0aDogc3RyaW5nfHVuZGVmaW5lZDtcbiAgICBsZXQgcHJveHlCaW5hcnlBcmdzOiBzdHJpbmdbXXx1bmRlZmluZWQ7XG4gICAgaWYgKGxhbmd1YWdlU2VydmVyUHJveHkpIHtcbiAgICAgIHByb3h5QmluYXJ5UGF0aCA9IGxhbmd1YWdlU2VydmVyUHJveHk7XG4gICAgICBwcm94eUJpbmFyeUFyZ3MgPSBsYW5ndWFnZVNlcnZlclByb3h5QXJncztcbiAgICB9XG4gICAgLy8gU2Vzc2lvbiBtYW5hZ2VzIGl0cyBvd24gbGlmZXRpbWUuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLXVudXNlZC1leHByZXNzaW9uXG4gICAgbmV3IFNlc3Npb24oXG4gICAgICAgIG5ldyBXZWJTb2NrZXRBZGFwdGVyKHdzKSwgcm9vdERpcmVjdG9yeSwgY29udGVudERpcmVjdG9yeSwgbG9nc0RpcixcbiAgICAgICAgcGlwTG9nc0RpciwgcHJveHlCaW5hcnlQYXRoLCBwcm94eUJpbmFyeUFyZ3MpO1xuICB9KTtcbn1cbiJdfQ==