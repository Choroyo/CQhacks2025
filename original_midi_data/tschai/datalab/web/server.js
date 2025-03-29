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
exports.run = run;
exports.stop = stop;
var http = require("http");
var httpProxy = require("http-proxy");
var path = require("path");
var url = require("url");
var jupyter = require("./jupyter");
var logging = require("./logging");
var python_lsp_1 = require("./python_lsp");
var reverseProxy = require("./reverseProxy");
var socketio_to_dap_1 = require("./socketio_to_dap");
var socketio_to_pty_1 = require("./socketio_to_pty");
var sockets = require("./sockets");
var server;
/**
 * The application settings instance.
 */
var appSettings;
var fileshim;
/**
 * Handles all requests.
 * @param request the incoming HTTP request.
 * @param response the out-going HTTP response.
 * @path the parsed path in the request.
 */
function handleRequest(request, response, requestPath) {
    return __awaiter(this, void 0, void 0, function () {
        var host, url_1, projectId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // /files and /static are only used in runlocal.
                    if (fileshim &&
                        ((requestPath.indexOf('/api/contents') === 0) ||
                            (requestPath.indexOf('/files') === 0))) {
                        fileshim.web(request, response, null);
                        return [2 /*return*/];
                    }
                    // The explicit set of paths we proxy to jupyter.
                    if ((requestPath.indexOf('/api') === 0) ||
                        (requestPath.indexOf('/nbextensions') === 0) ||
                        (requestPath.indexOf('/files') === 0) ||
                        (requestPath.indexOf('/static') === 0)) {
                        jupyter.handleRequest(request, response);
                        return [2 /*return*/];
                    }
                    if (!(appSettings.colabRedirect && requestPath === '/')) return [3 /*break*/, 3];
                    host = process.env['WEB_HOST'] || '';
                    url_1 = appSettings.colabRedirect.replace('{jupyter_host}', host);
                    if (!appSettings.colabRedirect.includes('{project_id}')) return [3 /*break*/, 2];
                    return [4 /*yield*/, readGceProjectId()];
                case 1:
                    projectId = _a.sent();
                    url_1 = url_1.replace('{project_id}', projectId);
                    _a.label = 2;
                case 2:
                    response.writeHead(302, {
                        'Location': url_1,
                    });
                    response.end();
                    return [2 /*return*/];
                case 3:
                    // Not Found
                    response.statusCode = 404;
                    response.end();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Base logic for handling all requests sent to the proxy web server. Some
 * requests are handled within the server, while some are proxied to the
 * Jupyter notebook server.
 *
 * Error handling is left to the caller.
 *
 * @param request the incoming HTTP request.
 * @param response the out-going HTTP response.
 */
function uncheckedRequestHandler(request, response) {
    var e_1, _a;
    var parsedUrl = url.parse(request.url || '', true);
    var urlpath = parsedUrl.pathname || '';
    logging.logRequest(request, response);
    try {
        for (var socketIoHandlers_1 = __values(socketIoHandlers), socketIoHandlers_1_1 = socketIoHandlers_1.next(); !socketIoHandlers_1_1.done; socketIoHandlers_1_1 = socketIoHandlers_1.next()) {
            var handler = socketIoHandlers_1_1.value;
            if (handler.isPathProxied(urlpath)) {
                // Will automatically be handled by socket.io.
                return;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (socketIoHandlers_1_1 && !socketIoHandlers_1_1.done && (_a = socketIoHandlers_1.return)) _a.call(socketIoHandlers_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var proxyPort = reverseProxy.getRequestPort(urlpath);
    if (sockets.isSocketIoPath(urlpath)) {
        // Will automatically be handled by socket.io.
    }
    else if (proxyPort && proxyPort !== request.socket.localPort) {
        // Do not allow proxying to this same port, as that can be used to mask the
        // target path.
        reverseProxy.handleRequest(request, response, proxyPort);
    }
    else {
        handleRequest(request, response, urlpath);
    }
}
/**
 * Handles all requests sent to the proxy web server. Some requests are handled
 * within the server, while some are proxied to the Jupyter notebook server.
 * @param request the incoming HTTP request.
 * @param response the out-going HTTP response.
 */
function requestHandler(request, response) {
    try {
        uncheckedRequestHandler(request, response);
    }
    catch (e) {
        logging.getLogger().error("Uncaught error handling a request to \"".concat(request.url, "\": ").concat(e));
    }
}
var socketIoHandlers = [];
/**
 * Runs the proxy web server.
 * @param settings the configuration settings to use.
 */
function run(settings) {
    jupyter.init(settings);
    reverseProxy.init(settings);
    appSettings = settings;
    if (settings.fileHandlerAddr) {
        fileshim = httpProxy.createProxyServer({ target: "http://".concat(appSettings.fileHandlerAddr) });
        fileshim.on('error', function (error, request, response) {
            logging.getLogger().error(error, "fileshim error for ".concat(request.url));
            response.writeHead(500, 'Internal Server Error');
            response.end();
        });
    }
    server = http.createServer(requestHandler);
    // Disable HTTP keep-alive connection timeouts in order to avoid connection
    // flakes. Details: b/112151064
    server.keepAliveTimeout = 0;
    var socketIoServer = sockets.init(server, settings);
    socketIoHandlers.push(new socketio_to_pty_1.SocketIoToPty('/tty', server));
    var dapServer;
    if (settings.debugAdapterMultiplexerPath) {
        dapServer =
            new socketio_to_dap_1.DapServer(settings.debugAdapterMultiplexerPath, socketIoServer);
    }
    var contentDir = path.join(settings.datalabRoot, settings.contentDir);
    var logsDir = path.join(settings.datalabRoot, '/var/colab/');
    var pipLogsDir = path.join(settings.datalabRoot, '/var/log/');
    // Handler manages its own lifetime.
    // tslint:disable-next-line:no-unused-expression
    new python_lsp_1.SocketIOToLsp(socketIoServer, __dirname, contentDir, logsDir, pipLogsDir, settings.languageServerProxy, settings.languageServerProxyArgs);
    server.on('upgrade', function (request, socket, head) {
        var parsedUrl = url.parse(request.url || '', true);
        var urlpath = parsedUrl.pathname || '';
        var proxyPort = reverseProxy.getRequestPort(urlpath);
        if (proxyPort && proxyPort !== request.socket.localPort) {
            reverseProxy.handleUpgrade(request, socket, head, proxyPort);
            return;
        }
        if (request.url === '/colab/tty') {
            (0, socketio_to_pty_1.WebSocketToPty)(request, socket, head);
            return;
        }
        if (request.url === '/colab/dap') {
            dapServer === null || dapServer === void 0 ? void 0 : dapServer.handleUpgrade(request, socket, head);
            return;
        }
        if (request.url === '/colab/lsp') {
            (0, python_lsp_1.WebSocketToLsp)(request, socket, head, __dirname, contentDir, logsDir, pipLogsDir, settings.languageServerProxy, settings.languageServerProxyArgs);
            return;
        }
        jupyter.handleSocket(request, socket, head);
    });
    logging.getLogger().info('Starting server at http://localhost:%d', settings.serverPort);
    process.on('SIGINT', function () { return process.exit(); });
    var options = {
        port: settings.serverPort,
        ipv6Only: false,
        host: settings.serverHost || ''
    };
    if ('TEST_TMPDIR' in process.env) {
        // Required to avoid "EAFNOSUPPORT: address family not supported" on
        // IPv6-only environments (notably, even with the host override below).
        options['ipv6Only'] = true;
        // ipv6Only alone isn't enough to avoid attempting to bind to 0.0.0.0 (which
        // fails on IPv6-only environments).  Need to specify an IP address because
        // DNS resolution even of ip6-localhost fails on some such environments.
        options['host'] = '::1';
    }
    server.listen(options);
}
/**
 * Stops the server and associated Jupyter server.
 */
function stop() {
    jupyter.close();
}
function readGceProjectId() {
    return __awaiter(this, void 0, Promise, function () {
        var metadataHost, port, portParts, projectId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    metadataHost = 'metadata.google.internal';
                    port = undefined;
                    if (process.env['GCE_METADATA_HOST']) {
                        metadataHost = process.env['GCE_METADATA_HOST'];
                        portParts = metadataHost.match(/(.*):(\d+)/);
                        if (portParts) {
                            metadataHost = portParts[1];
                            if (metadataHost.startsWith('[')) {
                                metadataHost = metadataHost.substring(1, metadataHost.length - 1);
                            }
                            port = Number(portParts[2]);
                        }
                    }
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            http.get({
                                hostname: metadataHost,
                                port: port,
                                path: '/computeMetadata/v1/project/project-id',
                                headers: { 'Metadata-Flavor': 'Google' }
                            }, function (response) {
                                var data = '';
                                response.on('data', function (chunk) {
                                    data += chunk;
                                });
                                response.on('end', function () {
                                    resolve(data);
                                });
                            })
                                .on('error', reject)
                                .end();
                        })];
                case 1:
                    projectId = _a.sent();
                    return [2 /*return*/, projectId.trim()];
            }
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vdGhpcmRfcGFydHkvY29sYWIvc291cmNlcy9zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7Ozs7OztHQWNHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ0lILGtCQXNGQztBQUtELG9CQUVDO0FBM05ELDJCQUE2QjtBQUM3QixzQ0FBd0M7QUFFeEMsMkJBQTZCO0FBQzdCLHlCQUEyQjtBQUczQixtQ0FBcUM7QUFDckMsbUNBQXFDO0FBQ3JDLDJDQUEyRDtBQUMzRCw2Q0FBK0M7QUFDL0MscURBQTRDO0FBQzVDLHFEQUFnRTtBQUNoRSxtQ0FBcUM7QUFFckMsSUFBSSxNQUFtQixDQUFDO0FBQ3hCOztHQUVHO0FBQ0gsSUFBSSxXQUF3QixDQUFDO0FBRTdCLElBQUksUUFBK0IsQ0FBQztBQUdwQzs7Ozs7R0FLRztBQUNILFNBQWUsYUFBYSxDQUN4QixPQUE2QixFQUFFLFFBQTZCLEVBQzVELFdBQW1COzs7Ozs7b0JBQ3JCLGdEQUFnRDtvQkFFaEQsSUFBSSxRQUFRO3dCQUNSLENBQUMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQzs0QkFDNUMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDNUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO3dCQUN0QyxzQkFBTztvQkFDVCxDQUFDO29CQUNELGlEQUFpRDtvQkFDakQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUNuQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUM1QyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO3dCQUNyQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQzt3QkFDM0MsT0FBTyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7d0JBQ3pDLHNCQUFPO29CQUNULENBQUM7eUJBQ0csQ0FBQSxXQUFXLENBQUMsYUFBYSxJQUFJLFdBQVcsS0FBSyxHQUFHLENBQUEsRUFBaEQsd0JBQWdEO29CQUM1QyxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7b0JBQ3ZDLFFBQU0sV0FBVyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7eUJBQ2hFLFdBQVcsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxFQUFsRCx3QkFBa0Q7b0JBQ2xDLHFCQUFNLGdCQUFnQixFQUFFLEVBQUE7O29CQUFwQyxTQUFTLEdBQUcsU0FBd0I7b0JBQzFDLEtBQUcsR0FBRyxLQUFHLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQzs7O29CQUUvQyxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTt3QkFDdEIsVUFBVSxFQUFFLEtBQUc7cUJBQ2hCLENBQUMsQ0FBQztvQkFDSCxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ2Ysc0JBQU87O29CQUdULFlBQVk7b0JBQ1osUUFBUSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7b0JBQzFCLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQzs7Ozs7Q0FDaEI7QUFFRDs7Ozs7Ozs7O0dBU0c7QUFDSCxTQUFTLHVCQUF1QixDQUM1QixPQUE2QixFQUFFLFFBQTZCOztJQUM5RCxJQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3JELElBQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxRQUFRLElBQUksRUFBRSxDQUFDO0lBRXpDLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDOztRQUV0QyxLQUFzQixJQUFBLHFCQUFBLFNBQUEsZ0JBQWdCLENBQUEsa0RBQUEsZ0ZBQUUsQ0FBQztZQUFwQyxJQUFNLE9BQU8sNkJBQUE7WUFDaEIsSUFBSSxPQUFPLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7Z0JBQ25DLDhDQUE4QztnQkFDOUMsT0FBTztZQUNULENBQUM7UUFDSCxDQUFDOzs7Ozs7Ozs7SUFFRCxJQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3ZELElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ3BDLDhDQUE4QztJQUNoRCxDQUFDO1NBQU0sSUFBSSxTQUFTLElBQUksU0FBUyxLQUFLLE9BQU8sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDL0QsMkVBQTJFO1FBQzNFLGVBQWU7UUFDZixZQUFZLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDM0QsQ0FBQztTQUFNLENBQUM7UUFDTixhQUFhLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM1QyxDQUFDO0FBQ0gsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBUyxjQUFjLENBQ25CLE9BQTZCLEVBQUUsUUFBNkI7SUFDOUQsSUFBSSxDQUFDO1FBQ0gsdUJBQXVCLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1gsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FDckIsaURBQXlDLE9BQU8sQ0FBQyxHQUFHLGlCQUFNLENBQUMsQ0FBRSxDQUFDLENBQUM7SUFDckUsQ0FBQztBQUNILENBQUM7QUFFRCxJQUFNLGdCQUFnQixHQUFvQixFQUFFLENBQUM7QUFFN0M7OztHQUdHO0FBQ0gsU0FBZ0IsR0FBRyxDQUFDLFFBQXFCO0lBQ3ZDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdkIsWUFBWSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM1QixXQUFXLEdBQUcsUUFBUSxDQUFDO0lBRXZCLElBQUksUUFBUSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQzdCLFFBQVEsR0FBRyxTQUFTLENBQUMsaUJBQWlCLENBQ2xDLEVBQUMsTUFBTSxFQUFFLGlCQUFVLFdBQVcsQ0FBQyxlQUFlLENBQUUsRUFBQyxDQUFDLENBQUM7UUFDdkQsUUFBUSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLFFBQVE7WUFDNUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsNkJBQXNCLE9BQU8sQ0FBQyxHQUFHLENBQUUsQ0FBQyxDQUFDO1lBQ3RFLFFBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLHVCQUF1QixDQUFDLENBQUM7WUFDakQsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELE1BQU0sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzNDLDJFQUEyRTtJQUMzRSwrQkFBK0I7SUFDL0IsTUFBTSxDQUFDLGdCQUFnQixHQUFHLENBQUMsQ0FBQztJQUU1QixJQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUV0RCxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSwrQkFBYSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBRXpELElBQUksU0FBb0IsQ0FBQztJQUN6QixJQUFJLFFBQVEsQ0FBQywyQkFBMkIsRUFBRSxDQUFDO1FBQ3pDLFNBQVM7WUFDTCxJQUFJLDJCQUFTLENBQUMsUUFBUSxDQUFDLDJCQUEyQixFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFFRCxJQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3hFLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUMvRCxJQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFFaEUsb0NBQW9DO0lBQ3BDLGdEQUFnRDtJQUNoRCxJQUFJLDBCQUFhLENBQ2IsY0FBYyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFDMUQsUUFBUSxDQUFDLG1CQUFtQixFQUFFLFFBQVEsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBRXBFLE1BQU0sQ0FBQyxFQUFFLENBQ0wsU0FBUyxFQUNULFVBQUMsT0FBNkIsRUFBRSxNQUFrQixFQUFFLElBQVk7UUFDOUQsSUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNyRCxJQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQztRQUN6QyxJQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZELElBQUksU0FBUyxJQUFJLFNBQVMsS0FBSyxPQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3hELFlBQVksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDN0QsT0FBTztRQUNULENBQUM7UUFDRCxJQUFJLE9BQU8sQ0FBQyxHQUFHLEtBQUssWUFBWSxFQUFFLENBQUM7WUFDakMsSUFBQSxnQ0FBYyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDdEMsT0FBTztRQUNULENBQUM7UUFDRCxJQUFJLE9BQU8sQ0FBQyxHQUFHLEtBQUssWUFBWSxFQUFFLENBQUM7WUFDakMsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLGFBQWEsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2hELE9BQU87UUFDVCxDQUFDO1FBQ0QsSUFBSSxPQUFPLENBQUMsR0FBRyxLQUFLLFlBQVksRUFBRSxDQUFDO1lBQ2pDLElBQUEsMkJBQWMsRUFDVixPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQ2pFLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxRQUFRLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUNwRSxPQUFPO1FBQ1QsQ0FBQztRQUNELE9BQU8sQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM5QyxDQUFDLENBQUMsQ0FBQztJQUdQLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQ3BCLHdDQUF3QyxFQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNuRSxPQUFPLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxjQUFNLE9BQUEsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFkLENBQWMsQ0FBQyxDQUFDO0lBQzNDLElBQU0sT0FBTyxHQUFHO1FBQ2QsSUFBSSxFQUFFLFFBQVEsQ0FBQyxVQUFVO1FBQ3pCLFFBQVEsRUFBRSxLQUFLO1FBQ2YsSUFBSSxFQUFFLFFBQVEsQ0FBQyxVQUFVLElBQUksRUFBRTtLQUNoQyxDQUFDO0lBQ0YsSUFBSSxhQUFhLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2pDLG9FQUFvRTtRQUNwRSx1RUFBdUU7UUFDdkUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUMzQiw0RUFBNEU7UUFDNUUsMkVBQTJFO1FBQzNFLHdFQUF3RTtRQUN4RSxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDO0lBQzFCLENBQUM7SUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3pCLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLElBQUk7SUFDbEIsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2xCLENBQUM7QUFFRCxTQUFlLGdCQUFnQjttQ0FBSSxPQUFPOzs7OztvQkFDcEMsWUFBWSxHQUFHLDBCQUEwQixDQUFDO29CQUMxQyxJQUFJLEdBQXFCLFNBQVMsQ0FBQztvQkFDdkMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLEVBQUUsQ0FBQzt3QkFDckMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQzt3QkFDMUMsU0FBUyxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7d0JBQ25ELElBQUksU0FBUyxFQUFFLENBQUM7NEJBQ2QsWUFBWSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDNUIsSUFBSSxZQUFZLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0NBQ2pDLFlBQVksR0FBRyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDOzRCQUNwRSxDQUFDOzRCQUNELElBQUksR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQzlCLENBQUM7b0JBQ0gsQ0FBQztvQkFDaUIscUJBQU0sSUFBSSxPQUFPLENBQVMsVUFBQyxPQUFPLEVBQUUsTUFBTTs0QkFDMUQsSUFBSSxDQUFDLEdBQUcsQ0FDQTtnQ0FDRSxRQUFRLEVBQUUsWUFBWTtnQ0FDdEIsSUFBSSxNQUFBO2dDQUNKLElBQUksRUFBRSx3Q0FBd0M7Z0NBQzlDLE9BQU8sRUFBRSxFQUFDLGlCQUFpQixFQUFFLFFBQVEsRUFBQzs2QkFDdkMsRUFDRCxVQUFDLFFBQVE7Z0NBQ1AsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO2dDQUNkLFFBQVEsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLFVBQUMsS0FBSztvQ0FDeEIsSUFBSSxJQUFJLEtBQUssQ0FBQztnQ0FDaEIsQ0FBQyxDQUFDLENBQUM7Z0NBQ0gsUUFBUSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUU7b0NBQ2pCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztnQ0FDaEIsQ0FBQyxDQUFDLENBQUM7NEJBQ0wsQ0FBQyxDQUFDO2lDQUNMLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDO2lDQUNuQixHQUFHLEVBQUUsQ0FBQzt3QkFDYixDQUFDLENBQUMsRUFBQTs7b0JBbkJJLFNBQVMsR0FBRyxTQW1CaEI7b0JBQ0Ysc0JBQU8sU0FBUyxDQUFDLElBQUksRUFBRSxFQUFDOzs7O0NBQ3pCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3RcbiAqIHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mXG4gKiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVFxuICogV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiBTZWUgdGhlXG4gKiBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9ucyB1bmRlclxuICogdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIGh0dHBQcm94eSBmcm9tICdodHRwLXByb3h5JztcbmltcG9ydCAqIGFzIG5ldCBmcm9tICduZXQnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHVybCBmcm9tICd1cmwnO1xuXG5pbXBvcnQge0FwcFNldHRpbmdzfSBmcm9tICcuL2FwcFNldHRpbmdzJztcbmltcG9ydCAqIGFzIGp1cHl0ZXIgZnJvbSAnLi9qdXB5dGVyJztcbmltcG9ydCAqIGFzIGxvZ2dpbmcgZnJvbSAnLi9sb2dnaW5nJztcbmltcG9ydCB7U29ja2V0SU9Ub0xzcCwgV2ViU29ja2V0VG9Mc3B9IGZyb20gJy4vcHl0aG9uX2xzcCc7XG5pbXBvcnQgKiBhcyByZXZlcnNlUHJveHkgZnJvbSAnLi9yZXZlcnNlUHJveHknO1xuaW1wb3J0IHtEYXBTZXJ2ZXJ9IGZyb20gJy4vc29ja2V0aW9fdG9fZGFwJztcbmltcG9ydCB7U29ja2V0SW9Ub1B0eSwgV2ViU29ja2V0VG9QdHl9IGZyb20gJy4vc29ja2V0aW9fdG9fcHR5JztcbmltcG9ydCAqIGFzIHNvY2tldHMgZnJvbSAnLi9zb2NrZXRzJztcblxubGV0IHNlcnZlcjogaHR0cC5TZXJ2ZXI7XG4vKipcbiAqIFRoZSBhcHBsaWNhdGlvbiBzZXR0aW5ncyBpbnN0YW5jZS5cbiAqL1xubGV0IGFwcFNldHRpbmdzOiBBcHBTZXR0aW5ncztcblxubGV0IGZpbGVzaGltOiBodHRwUHJveHkuUHJveHlTZXJ2ZXI7XG5cblxuLyoqXG4gKiBIYW5kbGVzIGFsbCByZXF1ZXN0cy5cbiAqIEBwYXJhbSByZXF1ZXN0IHRoZSBpbmNvbWluZyBIVFRQIHJlcXVlc3QuXG4gKiBAcGFyYW0gcmVzcG9uc2UgdGhlIG91dC1nb2luZyBIVFRQIHJlc3BvbnNlLlxuICogQHBhdGggdGhlIHBhcnNlZCBwYXRoIGluIHRoZSByZXF1ZXN0LlxuICovXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVSZXF1ZXN0KFxuICAgIHJlcXVlc3Q6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCByZXNwb25zZTogaHR0cC5TZXJ2ZXJSZXNwb25zZSxcbiAgICByZXF1ZXN0UGF0aDogc3RyaW5nKSB7XG4gIC8vIC9maWxlcyBhbmQgL3N0YXRpYyBhcmUgb25seSB1c2VkIGluIHJ1bmxvY2FsLlxuXG4gIGlmIChmaWxlc2hpbSAmJlxuICAgICAgKChyZXF1ZXN0UGF0aC5pbmRleE9mKCcvYXBpL2NvbnRlbnRzJykgPT09IDApIHx8XG4gICAgICAgKHJlcXVlc3RQYXRoLmluZGV4T2YoJy9maWxlcycpID09PSAwKSkpIHtcbiAgICBmaWxlc2hpbS53ZWIocmVxdWVzdCwgcmVzcG9uc2UsIG51bGwpO1xuICAgIHJldHVybjtcbiAgfVxuICAvLyBUaGUgZXhwbGljaXQgc2V0IG9mIHBhdGhzIHdlIHByb3h5IHRvIGp1cHl0ZXIuXG4gIGlmICgocmVxdWVzdFBhdGguaW5kZXhPZignL2FwaScpID09PSAwKSB8fFxuICAgICAgKHJlcXVlc3RQYXRoLmluZGV4T2YoJy9uYmV4dGVuc2lvbnMnKSA9PT0gMCkgfHxcbiAgICAgIChyZXF1ZXN0UGF0aC5pbmRleE9mKCcvZmlsZXMnKSA9PT0gMCkgfHxcbiAgICAgIChyZXF1ZXN0UGF0aC5pbmRleE9mKCcvc3RhdGljJykgPT09IDApKSB7XG4gICAganVweXRlci5oYW5kbGVSZXF1ZXN0KHJlcXVlc3QsIHJlc3BvbnNlKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGFwcFNldHRpbmdzLmNvbGFiUmVkaXJlY3QgJiYgcmVxdWVzdFBhdGggPT09ICcvJykge1xuICAgIGNvbnN0IGhvc3QgPSBwcm9jZXNzLmVudlsnV0VCX0hPU1QnXSB8fCAnJztcbiAgICBsZXQgdXJsID0gYXBwU2V0dGluZ3MuY29sYWJSZWRpcmVjdC5yZXBsYWNlKCd7anVweXRlcl9ob3N0fScsIGhvc3QpO1xuICAgIGlmIChhcHBTZXR0aW5ncy5jb2xhYlJlZGlyZWN0LmluY2x1ZGVzKCd7cHJvamVjdF9pZH0nKSkge1xuICAgICAgY29uc3QgcHJvamVjdElkID0gYXdhaXQgcmVhZEdjZVByb2plY3RJZCgpO1xuICAgICAgdXJsID0gdXJsLnJlcGxhY2UoJ3twcm9qZWN0X2lkfScsIHByb2plY3RJZCk7XG4gICAgfVxuICAgIHJlc3BvbnNlLndyaXRlSGVhZCgzMDIsIHtcbiAgICAgICdMb2NhdGlvbic6IHVybCxcbiAgICB9KTtcbiAgICByZXNwb25zZS5lbmQoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBOb3QgRm91bmRcbiAgcmVzcG9uc2Uuc3RhdHVzQ29kZSA9IDQwNDtcbiAgcmVzcG9uc2UuZW5kKCk7XG59XG5cbi8qKlxuICogQmFzZSBsb2dpYyBmb3IgaGFuZGxpbmcgYWxsIHJlcXVlc3RzIHNlbnQgdG8gdGhlIHByb3h5IHdlYiBzZXJ2ZXIuIFNvbWVcbiAqIHJlcXVlc3RzIGFyZSBoYW5kbGVkIHdpdGhpbiB0aGUgc2VydmVyLCB3aGlsZSBzb21lIGFyZSBwcm94aWVkIHRvIHRoZVxuICogSnVweXRlciBub3RlYm9vayBzZXJ2ZXIuXG4gKlxuICogRXJyb3IgaGFuZGxpbmcgaXMgbGVmdCB0byB0aGUgY2FsbGVyLlxuICpcbiAqIEBwYXJhbSByZXF1ZXN0IHRoZSBpbmNvbWluZyBIVFRQIHJlcXVlc3QuXG4gKiBAcGFyYW0gcmVzcG9uc2UgdGhlIG91dC1nb2luZyBIVFRQIHJlc3BvbnNlLlxuICovXG5mdW5jdGlvbiB1bmNoZWNrZWRSZXF1ZXN0SGFuZGxlcihcbiAgICByZXF1ZXN0OiBodHRwLkluY29taW5nTWVzc2FnZSwgcmVzcG9uc2U6IGh0dHAuU2VydmVyUmVzcG9uc2UpIHtcbiAgY29uc3QgcGFyc2VkVXJsID0gdXJsLnBhcnNlKHJlcXVlc3QudXJsIHx8ICcnLCB0cnVlKTtcbiAgY29uc3QgdXJscGF0aCA9IHBhcnNlZFVybC5wYXRobmFtZSB8fCAnJztcblxuICBsb2dnaW5nLmxvZ1JlcXVlc3QocmVxdWVzdCwgcmVzcG9uc2UpO1xuXG4gIGZvciAoY29uc3QgaGFuZGxlciBvZiBzb2NrZXRJb0hhbmRsZXJzKSB7XG4gICAgaWYgKGhhbmRsZXIuaXNQYXRoUHJveGllZCh1cmxwYXRoKSkge1xuICAgICAgLy8gV2lsbCBhdXRvbWF0aWNhbGx5IGJlIGhhbmRsZWQgYnkgc29ja2V0LmlvLlxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHByb3h5UG9ydCA9IHJldmVyc2VQcm94eS5nZXRSZXF1ZXN0UG9ydCh1cmxwYXRoKTtcbiAgaWYgKHNvY2tldHMuaXNTb2NrZXRJb1BhdGgodXJscGF0aCkpIHtcbiAgICAvLyBXaWxsIGF1dG9tYXRpY2FsbHkgYmUgaGFuZGxlZCBieSBzb2NrZXQuaW8uXG4gIH0gZWxzZSBpZiAocHJveHlQb3J0ICYmIHByb3h5UG9ydCAhPT0gcmVxdWVzdC5zb2NrZXQubG9jYWxQb3J0KSB7XG4gICAgLy8gRG8gbm90IGFsbG93IHByb3h5aW5nIHRvIHRoaXMgc2FtZSBwb3J0LCBhcyB0aGF0IGNhbiBiZSB1c2VkIHRvIG1hc2sgdGhlXG4gICAgLy8gdGFyZ2V0IHBhdGguXG4gICAgcmV2ZXJzZVByb3h5LmhhbmRsZVJlcXVlc3QocmVxdWVzdCwgcmVzcG9uc2UsIHByb3h5UG9ydCk7XG4gIH0gZWxzZSB7XG4gICAgaGFuZGxlUmVxdWVzdChyZXF1ZXN0LCByZXNwb25zZSwgdXJscGF0aCk7XG4gIH1cbn1cblxuLyoqXG4gKiBIYW5kbGVzIGFsbCByZXF1ZXN0cyBzZW50IHRvIHRoZSBwcm94eSB3ZWIgc2VydmVyLiBTb21lIHJlcXVlc3RzIGFyZSBoYW5kbGVkXG4gKiB3aXRoaW4gdGhlIHNlcnZlciwgd2hpbGUgc29tZSBhcmUgcHJveGllZCB0byB0aGUgSnVweXRlciBub3RlYm9vayBzZXJ2ZXIuXG4gKiBAcGFyYW0gcmVxdWVzdCB0aGUgaW5jb21pbmcgSFRUUCByZXF1ZXN0LlxuICogQHBhcmFtIHJlc3BvbnNlIHRoZSBvdXQtZ29pbmcgSFRUUCByZXNwb25zZS5cbiAqL1xuZnVuY3Rpb24gcmVxdWVzdEhhbmRsZXIoXG4gICAgcmVxdWVzdDogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlc3BvbnNlOiBodHRwLlNlcnZlclJlc3BvbnNlKSB7XG4gIHRyeSB7XG4gICAgdW5jaGVja2VkUmVxdWVzdEhhbmRsZXIocmVxdWVzdCwgcmVzcG9uc2UpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5lcnJvcihcbiAgICAgICAgYFVuY2F1Z2h0IGVycm9yIGhhbmRsaW5nIGEgcmVxdWVzdCB0byBcIiR7cmVxdWVzdC51cmx9XCI6ICR7ZX1gKTtcbiAgfVxufVxuXG5jb25zdCBzb2NrZXRJb0hhbmRsZXJzOiBTb2NrZXRJb1RvUHR5W10gPSBbXTtcblxuLyoqXG4gKiBSdW5zIHRoZSBwcm94eSB3ZWIgc2VydmVyLlxuICogQHBhcmFtIHNldHRpbmdzIHRoZSBjb25maWd1cmF0aW9uIHNldHRpbmdzIHRvIHVzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJ1bihzZXR0aW5nczogQXBwU2V0dGluZ3MpOiB2b2lkIHtcbiAganVweXRlci5pbml0KHNldHRpbmdzKTtcbiAgcmV2ZXJzZVByb3h5LmluaXQoc2V0dGluZ3MpO1xuICBhcHBTZXR0aW5ncyA9IHNldHRpbmdzO1xuXG4gIGlmIChzZXR0aW5ncy5maWxlSGFuZGxlckFkZHIpIHtcbiAgICBmaWxlc2hpbSA9IGh0dHBQcm94eS5jcmVhdGVQcm94eVNlcnZlcihcbiAgICAgICAge3RhcmdldDogYGh0dHA6Ly8ke2FwcFNldHRpbmdzLmZpbGVIYW5kbGVyQWRkcn1gfSk7XG4gICAgZmlsZXNoaW0ub24oJ2Vycm9yJywgKGVycm9yLCByZXF1ZXN0LCByZXNwb25zZSkgPT4ge1xuICAgICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5lcnJvcihlcnJvciwgYGZpbGVzaGltIGVycm9yIGZvciAke3JlcXVlc3QudXJsfWApO1xuICAgICAgcmVzcG9uc2Uud3JpdGVIZWFkKDUwMCwgJ0ludGVybmFsIFNlcnZlciBFcnJvcicpO1xuICAgICAgcmVzcG9uc2UuZW5kKCk7XG4gICAgfSk7XG4gIH1cblxuICBzZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcihyZXF1ZXN0SGFuZGxlcik7XG4gIC8vIERpc2FibGUgSFRUUCBrZWVwLWFsaXZlIGNvbm5lY3Rpb24gdGltZW91dHMgaW4gb3JkZXIgdG8gYXZvaWQgY29ubmVjdGlvblxuICAvLyBmbGFrZXMuIERldGFpbHM6IGIvMTEyMTUxMDY0XG4gIHNlcnZlci5rZWVwQWxpdmVUaW1lb3V0ID0gMDtcblxuICBjb25zdCBzb2NrZXRJb1NlcnZlciA9IHNvY2tldHMuaW5pdChzZXJ2ZXIsIHNldHRpbmdzKTtcblxuICBzb2NrZXRJb0hhbmRsZXJzLnB1c2gobmV3IFNvY2tldElvVG9QdHkoJy90dHknLCBzZXJ2ZXIpKTtcblxuICBsZXQgZGFwU2VydmVyOiBEYXBTZXJ2ZXI7XG4gIGlmIChzZXR0aW5ncy5kZWJ1Z0FkYXB0ZXJNdWx0aXBsZXhlclBhdGgpIHtcbiAgICBkYXBTZXJ2ZXIgPVxuICAgICAgICBuZXcgRGFwU2VydmVyKHNldHRpbmdzLmRlYnVnQWRhcHRlck11bHRpcGxleGVyUGF0aCwgc29ja2V0SW9TZXJ2ZXIpO1xuICB9XG5cbiAgY29uc3QgY29udGVudERpciA9IHBhdGguam9pbihzZXR0aW5ncy5kYXRhbGFiUm9vdCwgc2V0dGluZ3MuY29udGVudERpcik7XG4gIGNvbnN0IGxvZ3NEaXIgPSBwYXRoLmpvaW4oc2V0dGluZ3MuZGF0YWxhYlJvb3QsICcvdmFyL2NvbGFiLycpO1xuICBjb25zdCBwaXBMb2dzRGlyID0gcGF0aC5qb2luKHNldHRpbmdzLmRhdGFsYWJSb290LCAnL3Zhci9sb2cvJyk7XG5cbiAgLy8gSGFuZGxlciBtYW5hZ2VzIGl0cyBvd24gbGlmZXRpbWUuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby11bnVzZWQtZXhwcmVzc2lvblxuICBuZXcgU29ja2V0SU9Ub0xzcChcbiAgICAgIHNvY2tldElvU2VydmVyLCBfX2Rpcm5hbWUsIGNvbnRlbnREaXIsIGxvZ3NEaXIsIHBpcExvZ3NEaXIsXG4gICAgICBzZXR0aW5ncy5sYW5ndWFnZVNlcnZlclByb3h5LCBzZXR0aW5ncy5sYW5ndWFnZVNlcnZlclByb3h5QXJncyk7XG5cbiAgc2VydmVyLm9uKFxuICAgICAgJ3VwZ3JhZGUnLFxuICAgICAgKHJlcXVlc3Q6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCBzb2NrZXQ6IG5ldC5Tb2NrZXQsIGhlYWQ6IEJ1ZmZlcikgPT4ge1xuICAgICAgICBjb25zdCBwYXJzZWRVcmwgPSB1cmwucGFyc2UocmVxdWVzdC51cmwgfHwgJycsIHRydWUpO1xuICAgICAgICBjb25zdCB1cmxwYXRoID0gcGFyc2VkVXJsLnBhdGhuYW1lIHx8ICcnO1xuICAgICAgICBjb25zdCBwcm94eVBvcnQgPSByZXZlcnNlUHJveHkuZ2V0UmVxdWVzdFBvcnQodXJscGF0aCk7XG4gICAgICAgIGlmIChwcm94eVBvcnQgJiYgcHJveHlQb3J0ICE9PSByZXF1ZXN0LnNvY2tldC5sb2NhbFBvcnQpIHtcbiAgICAgICAgICByZXZlcnNlUHJveHkuaGFuZGxlVXBncmFkZShyZXF1ZXN0LCBzb2NrZXQsIGhlYWQsIHByb3h5UG9ydCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXF1ZXN0LnVybCA9PT0gJy9jb2xhYi90dHknKSB7XG4gICAgICAgICAgV2ViU29ja2V0VG9QdHkocmVxdWVzdCwgc29ja2V0LCBoZWFkKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlcXVlc3QudXJsID09PSAnL2NvbGFiL2RhcCcpIHtcbiAgICAgICAgICBkYXBTZXJ2ZXI/LmhhbmRsZVVwZ3JhZGUocmVxdWVzdCwgc29ja2V0LCBoZWFkKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlcXVlc3QudXJsID09PSAnL2NvbGFiL2xzcCcpIHtcbiAgICAgICAgICBXZWJTb2NrZXRUb0xzcChcbiAgICAgICAgICAgICAgcmVxdWVzdCwgc29ja2V0LCBoZWFkLCBfX2Rpcm5hbWUsIGNvbnRlbnREaXIsIGxvZ3NEaXIsIHBpcExvZ3NEaXIsXG4gICAgICAgICAgICAgIHNldHRpbmdzLmxhbmd1YWdlU2VydmVyUHJveHksIHNldHRpbmdzLmxhbmd1YWdlU2VydmVyUHJveHlBcmdzKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAganVweXRlci5oYW5kbGVTb2NrZXQocmVxdWVzdCwgc29ja2V0LCBoZWFkKTtcbiAgICAgIH0pO1xuXG5cbiAgbG9nZ2luZy5nZXRMb2dnZXIoKS5pbmZvKFxuICAgICAgJ1N0YXJ0aW5nIHNlcnZlciBhdCBodHRwOi8vbG9jYWxob3N0OiVkJywgc2V0dGluZ3Muc2VydmVyUG9ydCk7XG4gIHByb2Nlc3Mub24oJ1NJR0lOVCcsICgpID0+IHByb2Nlc3MuZXhpdCgpKTtcbiAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICBwb3J0OiBzZXR0aW5ncy5zZXJ2ZXJQb3J0LFxuICAgIGlwdjZPbmx5OiBmYWxzZSxcbiAgICBob3N0OiBzZXR0aW5ncy5zZXJ2ZXJIb3N0IHx8ICcnXG4gIH07XG4gIGlmICgnVEVTVF9UTVBESVInIGluIHByb2Nlc3MuZW52KSB7XG4gICAgLy8gUmVxdWlyZWQgdG8gYXZvaWQgXCJFQUZOT1NVUFBPUlQ6IGFkZHJlc3MgZmFtaWx5IG5vdCBzdXBwb3J0ZWRcIiBvblxuICAgIC8vIElQdjYtb25seSBlbnZpcm9ubWVudHMgKG5vdGFibHksIGV2ZW4gd2l0aCB0aGUgaG9zdCBvdmVycmlkZSBiZWxvdykuXG4gICAgb3B0aW9uc1snaXB2Nk9ubHknXSA9IHRydWU7XG4gICAgLy8gaXB2Nk9ubHkgYWxvbmUgaXNuJ3QgZW5vdWdoIHRvIGF2b2lkIGF0dGVtcHRpbmcgdG8gYmluZCB0byAwLjAuMC4wICh3aGljaFxuICAgIC8vIGZhaWxzIG9uIElQdjYtb25seSBlbnZpcm9ubWVudHMpLiAgTmVlZCB0byBzcGVjaWZ5IGFuIElQIGFkZHJlc3MgYmVjYXVzZVxuICAgIC8vIEROUyByZXNvbHV0aW9uIGV2ZW4gb2YgaXA2LWxvY2FsaG9zdCBmYWlscyBvbiBzb21lIHN1Y2ggZW52aXJvbm1lbnRzLlxuICAgIG9wdGlvbnNbJ2hvc3QnXSA9ICc6OjEnO1xuICB9XG4gIHNlcnZlci5saXN0ZW4ob3B0aW9ucyk7XG59XG5cbi8qKlxuICogU3RvcHMgdGhlIHNlcnZlciBhbmQgYXNzb2NpYXRlZCBKdXB5dGVyIHNlcnZlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3AoKTogdm9pZCB7XG4gIGp1cHl0ZXIuY2xvc2UoKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVhZEdjZVByb2plY3RJZCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICBsZXQgbWV0YWRhdGFIb3N0ID0gJ21ldGFkYXRhLmdvb2dsZS5pbnRlcm5hbCc7XG4gIGxldCBwb3J0OiB1bmRlZmluZWR8bnVtYmVyID0gdW5kZWZpbmVkO1xuICBpZiAocHJvY2Vzcy5lbnZbJ0dDRV9NRVRBREFUQV9IT1NUJ10pIHtcbiAgICBtZXRhZGF0YUhvc3QgPSBwcm9jZXNzLmVudlsnR0NFX01FVEFEQVRBX0hPU1QnXTtcbiAgICBjb25zdCBwb3J0UGFydHMgPSBtZXRhZGF0YUhvc3QubWF0Y2goLyguKik6KFxcZCspLyk7XG4gICAgaWYgKHBvcnRQYXJ0cykge1xuICAgICAgbWV0YWRhdGFIb3N0ID0gcG9ydFBhcnRzWzFdO1xuICAgICAgaWYgKG1ldGFkYXRhSG9zdC5zdGFydHNXaXRoKCdbJykpIHtcbiAgICAgICAgbWV0YWRhdGFIb3N0ID0gbWV0YWRhdGFIb3N0LnN1YnN0cmluZygxLCBtZXRhZGF0YUhvc3QubGVuZ3RoIC0gMSk7XG4gICAgICB9XG4gICAgICBwb3J0ID0gTnVtYmVyKHBvcnRQYXJ0c1syXSk7XG4gICAgfVxuICB9XG4gIGNvbnN0IHByb2plY3RJZCA9IGF3YWl0IG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGh0dHAuZ2V0KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBob3N0bmFtZTogbWV0YWRhdGFIb3N0LFxuICAgICAgICAgICAgICBwb3J0LFxuICAgICAgICAgICAgICBwYXRoOiAnL2NvbXB1dGVNZXRhZGF0YS92MS9wcm9qZWN0L3Byb2plY3QtaWQnLFxuICAgICAgICAgICAgICBoZWFkZXJzOiB7J01ldGFkYXRhLUZsYXZvcic6ICdHb29nbGUnfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICBsZXQgZGF0YSA9ICcnO1xuICAgICAgICAgICAgICByZXNwb25zZS5vbignZGF0YScsIChjaHVuaykgPT4ge1xuICAgICAgICAgICAgICAgIGRhdGEgKz0gY2h1bms7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXNwb25zZS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgLm9uKCdlcnJvcicsIHJlamVjdClcbiAgICAgICAgLmVuZCgpO1xuICB9KTtcbiAgcmV0dXJuIHByb2plY3RJZC50cmltKCk7XG59XG4iXX0=