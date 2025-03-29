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
exports.init = init;
exports.close = close;
exports.handleSocket = handleSocket;
exports.handleRequest = handleRequest;
var childProcess = require("child_process");
var httpProxy = require("http-proxy");
var path = require("path");
var logging = require("./logging");
/**
 * Singleton tracking the jupyter server instance we manage.
 */
var jupyterServer = null;
/**
 * The maximum number of times we'll restart jupyter; we set a limit to avoid
 * users being stuck with a slow-crash-looping server.
 */
var remainingJupyterServerRestarts = 20;
/**
 * The application settings instance.
 */
var appSettings;
/*
 * This list of levels should match the ones used by Python:
 *   https://docs.python.org/3/library/logging.html#logging-levels
 */
var LogLevels;
(function (LogLevels) {
    LogLevels["CRITICAL"] = "CRITICAL";
    LogLevels["ERROR"] = "ERROR";
    LogLevels["WARNING"] = "WARNING";
    LogLevels["INFO"] = "INFO";
    LogLevels["DEBUG"] = "DEBUG";
    LogLevels["NOTSET"] = "NOTSET";
})(LogLevels || (LogLevels = {}));
function pipeOutput(stream) {
    stream.setEncoding('utf8');
    // The format we parse here corresponds to the log format we set in our
    // jupyter configuration.
    var logger = logging.getJupyterLogger();
    stream.on('data', function (data) {
        var e_1, _a;
        try {
            for (var _b = __values(data.split('\n')), _c = _b.next(); !_c.done; _c = _b.next()) {
                var line = _c.value;
                if (line.trim().length === 0) {
                    continue;
                }
                var parts = line.split('|', 3);
                if (parts.length !== 3) {
                    // Non-logging messages (eg tracebacks) get logged as warnings.
                    logger.warn(line);
                    continue;
                }
                var level = parts[1];
                var message = parts[2];
                // We need to map Python's log levels to those used by bunyan.
                if (level === LogLevels.CRITICAL || level === LogLevels.ERROR) {
                    logger.error(message);
                }
                else if (level === LogLevels.WARNING) {
                    logger.warn(message);
                }
                else if (level === LogLevels.INFO) {
                    logger.info(message);
                }
                else {
                    // We map DEBUG, NOTSET, and any unknown log levels to debug.
                    logger.debug(message);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
function createJupyterServer() {
    var e_2, _a;
    if (!remainingJupyterServerRestarts) {
        logging.getLogger().error('No jupyter restart attempts remaining.');
        return;
    }
    remainingJupyterServerRestarts -= 1;
    var port = appSettings.nextJupyterPort;
    logging.getLogger().info('Launching Jupyter server at %d', port);
    var jupyterArgs = appSettings.jupyterArgs || [];
    function exitHandler(code, signal) {
        if (jupyterServer) {
            logging.getLogger().error('Jupyter process %d exited due to signal: %s', jupyterServer.childProcess.pid, signal);
        }
        else {
            logging.getLogger().error('Jupyter process exit before server creation finished due to signal: %s', signal);
        }
        // We want to restart jupyter whenever it terminates.
        createJupyterServer();
    }
    var contentDir = path.join(appSettings.datalabRoot, appSettings.contentDir);
    var processArgs = ['notebook'].concat(jupyterArgs || []).concat([
        "--port=".concat(port),
        "--FileContentsManager.root_dir=".concat(appSettings.datalabRoot, "/"),
        // TODO: b/136659627 - Delete this line.
        "--MappingKernelManager.root_dir=".concat(contentDir),
    ]);
    var jupyterServerAddr = 'localhost';
    try {
        for (var jupyterArgs_1 = __values(jupyterArgs), jupyterArgs_1_1 = jupyterArgs_1.next(); !jupyterArgs_1_1.done; jupyterArgs_1_1 = jupyterArgs_1.next()) {
            var flag = jupyterArgs_1_1.value;
            // Extracts a string like '1.2.3.4' from the string '--ip=1.2.3.4'
            var match = flag.match(/--ip=([^ ]+)/);
            if (match) {
                jupyterServerAddr = match[1];
                break;
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (jupyterArgs_1_1 && !jupyterArgs_1_1.done && (_a = jupyterArgs_1.return)) _a.call(jupyterArgs_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    logging.getLogger().info('Using jupyter server address %s', jupyterServerAddr);
    var processOptions = {
        detached: false,
        env: process.env,
    };
    var serverProcess = childProcess.spawn('jupyter', processArgs, processOptions);
    serverProcess.on('exit', exitHandler);
    logging.getLogger().info('Jupyter process started with pid %d and args %j', serverProcess.pid, processArgs);
    // Capture the output, so it can be piped for logging.
    pipeOutput(serverProcess.stdout);
    pipeOutput(serverProcess.stderr);
    // Create the proxy.
    var proxyTargetHost = appSettings.kernelManagerProxyHost || jupyterServerAddr;
    var proxyTargetPort = appSettings.kernelManagerProxyPort || port;
    var proxy = httpProxy.createProxyServer({ target: "http://".concat(proxyTargetHost, ":").concat(proxyTargetPort) });
    proxy.on('error', errorHandler);
    jupyterServer = { port: port, proxy: proxy, childProcess: serverProcess };
}
/**
 * Initializes the Jupyter server manager.
 */
function init(settings) {
    appSettings = settings;
    createJupyterServer();
}
/**
 * Closes the Jupyter server manager.
 */
function close() {
    if (!jupyterServer) {
        return;
    }
    var pid = jupyterServer.childProcess.pid;
    logging.getLogger().info("jupyter close: PID: ".concat(pid));
    jupyterServer.childProcess.kill('SIGHUP');
}
/** Proxy this socket request to jupyter. */
function handleSocket(request, socket, head) {
    if (!jupyterServer) {
        logging.getLogger().error('Jupyter server is not running.');
        return;
    }
    jupyterServer.proxy.ws(request, socket, head);
}
/** Proxy this HTTP request to jupyter. */
function handleRequest(request, response) {
    if (!jupyterServer) {
        response.statusCode = 500;
        response.end();
        return;
    }
    jupyterServer.proxy.web(request, response, null);
}
function errorHandler(error, request, response) {
    logging.getLogger().error(error, 'Jupyter server returned error.');
    response.writeHead(500, 'Internal Server Error');
    response.end();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianVweXRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3RoaXJkX3BhcnR5L2NvbGFiL3NvdXJjZXMvanVweXRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7O0dBY0c7Ozs7Ozs7Ozs7Ozs7QUEySkgsb0JBR0M7QUFLRCxzQkFRQztBQUdELG9DQU9DO0FBR0Qsc0NBU0M7QUEvTEQsNENBQThDO0FBRTlDLHNDQUF3QztBQUV4QywyQkFBNkI7QUFHN0IsbUNBQXFDO0FBUXJDOztHQUVHO0FBQ0gsSUFBSSxhQUFhLEdBQXVCLElBQUksQ0FBQztBQUU3Qzs7O0dBR0c7QUFDSCxJQUFJLDhCQUE4QixHQUFXLEVBQUUsQ0FBQztBQUVoRDs7R0FFRztBQUNILElBQUksV0FBd0IsQ0FBQztBQUU3Qjs7O0dBR0c7QUFDSCxJQUFLLFNBT0o7QUFQRCxXQUFLLFNBQVM7SUFDWixrQ0FBcUIsQ0FBQTtJQUNyQiw0QkFBZSxDQUFBO0lBQ2YsZ0NBQW1CLENBQUE7SUFDbkIsMEJBQWEsQ0FBQTtJQUNiLDRCQUFlLENBQUE7SUFDZiw4QkFBaUIsQ0FBQTtBQUNuQixDQUFDLEVBUEksU0FBUyxLQUFULFNBQVMsUUFPYjtBQUVELFNBQVMsVUFBVSxDQUFDLE1BQTZCO0lBQy9DLE1BQU0sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFM0IsdUVBQXVFO0lBQ3ZFLHlCQUF5QjtJQUN6QixJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUMxQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxVQUFDLElBQVk7OztZQUM3QixLQUFtQixJQUFBLEtBQUEsU0FBQSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBLGdCQUFBLDRCQUFFLENBQUM7Z0JBQWpDLElBQU0sSUFBSSxXQUFBO2dCQUNiLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFD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QUVELGFBQWEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDbkQsQ0FBQztBQUVELFNBQVMsWUFBWSxDQUNqQixLQUFZLEVBQUUsT0FBNkIsRUFDM0MsUUFBNkI7SUFDL0IsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztJQUVuRSxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO0lBQ2pELFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNqQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3RcbiAqIHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS4gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mXG4gKiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUywgV0lUSE9VVFxuICogV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLiBTZWUgdGhlXG4gKiBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZCBsaW1pdGF0aW9ucyB1bmRlclxuICogdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0ICogYXMgY2hpbGRQcm9jZXNzIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIGh0dHBQcm94eSBmcm9tICdodHRwLXByb3h5JztcbmltcG9ydCAqIGFzIG5ldCBmcm9tICduZXQnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuaW1wb3J0IHtBcHBTZXR0aW5nc30gZnJvbSAnLi9hcHBTZXR0aW5ncyc7XG5pbXBvcnQgKiBhcyBsb2dnaW5nIGZyb20gJy4vbG9nZ2luZyc7XG5cbmludGVyZmFjZSBKdXB5dGVyU2VydmVyIHtcbiAgcG9ydDogbnVtYmVyO1xuICBjaGlsZFByb2Nlc3M6IGNoaWxkUHJvY2Vzcy5DaGlsZFByb2Nlc3M7XG4gIHByb3h5OiBodHRwUHJveHkuUHJveHlTZXJ2ZXI7XG59XG5cbi8qKlxuICogU2luZ2xldG9uIHRyYWNraW5nIHRoZSBqdXB5dGVyIHNlcnZlciBpbnN0YW5jZSB3ZSBtYW5hZ2UuXG4gKi9cbmxldCBqdXB5dGVyU2VydmVyOiBKdXB5dGVyU2VydmVyfG51bGwgPSBudWxsO1xuXG4vKipcbiAqIFRoZSBtYXhpbXVtIG51bWJlciBvZiB0aW1lcyB3ZSdsbCByZXN0YXJ0IGp1cHl0ZXI7IHdlIHNldCBhIGxpbWl0IHRvIGF2b2lkXG4gKiB1c2VycyBiZWluZyBzdHVjayB3aXRoIGEgc2xvdy1jcmFzaC1sb29waW5nIHNlcnZlci5cbiAqL1xubGV0IHJlbWFpbmluZ0p1cHl0ZXJTZXJ2ZXJSZXN0YXJ0czogbnVtYmVyID0gMjA7XG5cbi8qKlxuICogVGhlIGFwcGxpY2F0aW9uIHNldHRpbmdzIGluc3RhbmNlLlxuICovXG5sZXQgYXBwU2V0dGluZ3M6IEFwcFNldHRpbmdzO1xuXG4vKlxuICogVGhpcyBsaXN0IG9mIGxldmVscyBzaG91bGQgbWF0Y2ggdGhlIG9uZXMgdXNlZCBieSBQeXRob246XG4gKiAgIGh0dHBzOi8vZG9jcy5weXRob24ub3JnLzMvbGlicmFyeS9sb2dnaW5nLmh0bWwjbG9nZ2luZy1sZXZlbHNcbiAqL1xuZW51bSBMb2dMZXZlbHMge1xuICBDUklUSUNBTCA9ICdDUklUSUNBTCcsXG4gIEVSUk9SID0gJ0VSUk9SJyxcbiAgV0FSTklORyA9ICdXQVJOSU5HJyxcbiAgSU5GTyA9ICdJTkZPJyxcbiAgREVCVUcgPSAnREVCVUcnLFxuICBOT1RTRVQgPSAnTk9UU0VUJyxcbn1cblxuZnVuY3Rpb24gcGlwZU91dHB1dChzdHJlYW06IE5vZGVKUy5SZWFkYWJsZVN0cmVhbSkge1xuICBzdHJlYW0uc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcblxuICAvLyBUaGUgZm9ybWF0IHdlIHBhcnNlIGhlcmUgY29ycmVzcG9uZHMgdG8gdGhlIGxvZyBmb3JtYXQgd2Ugc2V0IGluIG91clxuICAvLyBqdXB5dGVyIGNvbmZpZ3VyYXRpb24uXG4gIGNvbnN0IGxvZ2dlciA9IGxvZ2dpbmcuZ2V0SnVweXRlckxvZ2dlcigpO1xuICBzdHJlYW0ub24oJ2RhdGEnLCAoZGF0YTogc3RyaW5nKSA9PiB7XG4gICAgZm9yIChjb25zdCBsaW5lIG9mIGRhdGEuc3BsaXQoJ1xcbicpKSB7XG4gICAgICBpZiAobGluZS50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgcGFydHMgPSBsaW5lLnNwbGl0KCd8JywgMyk7XG4gICAgICBpZiAocGFydHMubGVuZ3RoICE9PSAzKSB7XG4gICAgICAgIC8vIE5vbi1sb2dnaW5nIG1lc3NhZ2VzIChlZyB0cmFjZWJhY2tzKSBnZXQgbG9nZ2VkIGFzIHdhcm5pbmdzLlxuICAgICAgICBsb2dnZXIud2FybihsaW5lKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBsZXZlbCA9IHBhcnRzWzFdO1xuICAgICAgY29uc3QgbWVzc2FnZSA9IHBhcnRzWzJdO1xuICAgICAgLy8gV2UgbmVlZCB0byBtYXAgUHl0aG9uJ3MgbG9nIGxldmVscyB0byB0aG9zZSB1c2VkIGJ5IGJ1bnlhbi5cbiAgICAgIGlmIChsZXZlbCA9PT0gTG9nTGV2ZWxzLkNSSVRJQ0FMIHx8IGxldmVsID09PSBMb2dMZXZlbHMuRVJST1IpIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKG1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIGlmIChsZXZlbCA9PT0gTG9nTGV2ZWxzLldBUk5JTkcpIHtcbiAgICAgICAgbG9nZ2VyLndhcm4obWVzc2FnZSk7XG4gICAgICB9IGVsc2UgaWYgKGxldmVsID09PSBMb2dMZXZlbHMuSU5GTykge1xuICAgICAgICBsb2dnZXIuaW5mbyhtZXNzYWdlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFdlIG1hcCBERUJVRywgTk9UU0VULCBhbmQgYW55IHVua25vd24gbG9nIGxldmVscyB0byBkZWJ1Zy5cbiAgICAgICAgbG9nZ2VyLmRlYnVnKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUp1cHl0ZXJTZXJ2ZXIoKSB7XG4gIGlmICghcmVtYWluaW5nSnVweXRlclNlcnZlclJlc3RhcnRzKSB7XG4gICAgbG9nZ2luZy5nZXRMb2dnZXIoKS5lcnJvcignTm8ganVweXRlciByZXN0YXJ0IGF0dGVtcHRzIHJlbWFpbmluZy4nKTtcbiAgICByZXR1cm47XG4gIH1cbiAgcmVtYWluaW5nSnVweXRlclNlcnZlclJlc3RhcnRzIC09IDE7XG4gIGNvbnN0IHBvcnQgPSBhcHBTZXR0aW5ncy5uZXh0SnVweXRlclBvcnQ7XG4gIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuaW5mbygnTGF1bmNoaW5nIEp1cHl0ZXIgc2VydmVyIGF0ICVkJywgcG9ydCk7XG4gIGNvbnN0IGp1cHl0ZXJBcmdzID0gYXBwU2V0dGluZ3MuanVweXRlckFyZ3MgfHwgW107XG5cbiAgZnVuY3Rpb24gZXhpdEhhbmRsZXIoY29kZTogbnVtYmVyLCBzaWduYWw6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmIChqdXB5dGVyU2VydmVyKSB7XG4gICAgICBsb2dnaW5nLmdldExvZ2dlcigpLmVycm9yKFxuICAgICAgICAgICdKdXB5dGVyIHByb2Nlc3MgJWQgZXhpdGVkIGR1ZSB0byBzaWduYWw6ICVzJyxcbiAgICAgICAgICBqdXB5dGVyU2VydmVyLmNoaWxkUHJvY2Vzcy5waWQhLCBzaWduYWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2dnaW5nLmdldExvZ2dlcigpLmVycm9yKFxuICAgICAgICAgICdKdXB5dGVyIHByb2Nlc3MgZXhpdCBiZWZvcmUgc2VydmVyIGNyZWF0aW9uIGZpbmlzaGVkIGR1ZSB0byBzaWduYWw6ICVzJyxcbiAgICAgICAgICBzaWduYWwpO1xuICAgIH1cbiAgICAvLyBXZSB3YW50IHRvIHJlc3RhcnQganVweXRlciB3aGVuZXZlciBpdCB0ZXJtaW5hdGVzLlxuICAgIGNyZWF0ZUp1cHl0ZXJTZXJ2ZXIoKTtcbiAgfVxuXG4gIGNvbnN0IGNvbnRlbnREaXIgPSBwYXRoLmpvaW4oYXBwU2V0dGluZ3MuZGF0YWxhYlJvb3QsIGFwcFNldHRpbmdzLmNvbnRlbnREaXIpO1xuICBjb25zdCBwcm9jZXNzQXJncyA9IFsnbm90ZWJvb2snXS5jb25jYXQoanVweXRlckFyZ3MgfHwgW10pLmNvbmNhdChbXG4gICAgYC0tcG9ydD0ke3BvcnR9YCxcbiAgICBgLS1GaWxlQ29udGVudHNNYW5hZ2VyLnJvb3RfZGlyPSR7YXBwU2V0dGluZ3MuZGF0YWxhYlJvb3R9L2AsXG4gICAgLy8gVE9ETzogYi8xMzY2NTk2MjcgLSBEZWxldGUgdGhpcyBsaW5lLlxuICAgIGAtLU1hcHBpbmdLZXJuZWxNYW5hZ2VyLnJvb3RfZGlyPSR7Y29udGVudERpcn1gLFxuICBdKTtcblxuICBsZXQganVweXRlclNlcnZlckFkZHIgPSAnbG9jYWxob3N0JztcbiAgZm9yIChjb25zdCBmbGFnIG9mIGp1cHl0ZXJBcmdzKSB7XG4gICAgLy8gRXh0cmFjdHMgYSBzdHJpbmcgbGlrZSAnMS4yLjMuNCcgZnJvbSB0aGUgc3RyaW5nICctLWlwPTEuMi4zLjQnXG4gICAgY29uc3QgbWF0Y2ggPSBmbGFnLm1hdGNoKC8tLWlwPShbXiBdKykvKTtcbiAgICBpZiAobWF0Y2gpIHtcbiAgICAgIGp1cHl0ZXJTZXJ2ZXJBZGRyID0gbWF0Y2hbMV07XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgbG9nZ2luZy5nZXRMb2dnZXIoKS5pbmZvKFxuICAgICAgJ1VzaW5nIGp1cHl0ZXIgc2VydmVyIGFkZHJlc3MgJXMnLCBqdXB5dGVyU2VydmVyQWRkcik7XG5cbiAgY29uc3QgcHJvY2Vzc09wdGlvbnMgPSB7XG4gICAgZGV0YWNoZWQ6IGZhbHNlLFxuICAgIGVudjogcHJvY2Vzcy5lbnYsXG4gIH07XG5cbiAgY29uc3Qgc2VydmVyUHJvY2VzcyA9XG4gICAgICBjaGlsZFByb2Nlc3Muc3Bhd24oJ2p1cHl0ZXInLCBwcm9jZXNzQXJncywgcHJvY2Vzc09wdGlvbnMpO1xuICBzZXJ2ZXJQcm9jZXNzLm9uKCdleGl0JywgZXhpdEhhbmRsZXIpO1xuICBsb2dnaW5nLmdldExvZ2dlcigpLmluZm8oXG4gICAgICAnSnVweXRlciBwcm9jZXNzIHN0YXJ0ZWQgd2l0aCBwaWQgJWQgYW5kIGFyZ3MgJWonLCBzZXJ2ZXJQcm9jZXNzLnBpZCEsXG4gICAgICBwcm9jZXNzQXJncyk7XG5cbiAgLy8gQ2FwdHVyZSB0aGUgb3V0cHV0LCBzbyBpdCBjYW4gYmUgcGlwZWQgZm9yIGxvZ2dpbmcuXG4gIHBpcGVPdXRwdXQoc2VydmVyUHJvY2Vzcy5zdGRvdXQpO1xuICBwaXBlT3V0cHV0KHNlcnZlclByb2Nlc3Muc3RkZXJyKTtcblxuICAvLyBDcmVhdGUgdGhlIHByb3h5LlxuICBjb25zdCBwcm94eVRhcmdldEhvc3QgPVxuICAgICAgYXBwU2V0dGluZ3Mua2VybmVsTWFuYWdlclByb3h5SG9zdCB8fCBqdXB5dGVyU2VydmVyQWRkcjtcbiAgY29uc3QgcHJveHlUYXJnZXRQb3J0ID0gYXBwU2V0dGluZ3Mua2VybmVsTWFuYWdlclByb3h5UG9ydCB8fCBwb3J0O1xuXG4gIGNvbnN0IHByb3h5ID0gaHR0cFByb3h5LmNyZWF0ZVByb3h5U2VydmVyKFxuICAgICAge3RhcmdldDogYGh0dHA6Ly8ke3Byb3h5VGFyZ2V0SG9zdH06JHtwcm94eVRhcmdldFBvcnR9YH0pO1xuICBwcm94eS5vbignZXJyb3InLCBlcnJvckhhbmRsZXIpO1xuXG4gIGp1cHl0ZXJTZXJ2ZXIgPSB7cG9ydCwgcHJveHksIGNoaWxkUHJvY2Vzczogc2VydmVyUHJvY2Vzc307XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgdGhlIEp1cHl0ZXIgc2VydmVyIG1hbmFnZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0KHNldHRpbmdzOiBBcHBTZXR0aW5ncyk6IHZvaWQge1xuICBhcHBTZXR0aW5ncyA9IHNldHRpbmdzO1xuICBjcmVhdGVKdXB5dGVyU2VydmVyKCk7XG59XG5cbi8qKlxuICogQ2xvc2VzIHRoZSBKdXB5dGVyIHNlcnZlciBtYW5hZ2VyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xvc2UoKTogdm9pZCB7XG4gIGlmICghanVweXRlclNlcnZlcikge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHBpZCA9IGp1cHl0ZXJTZXJ2ZXIuY2hpbGRQcm9jZXNzLnBpZDtcbiAgbG9nZ2luZy5nZXRMb2dnZXIoKS5pbmZvKGBqdXB5dGVyIGNsb3NlOiBQSUQ6ICR7cGlkfWApO1xuICBqdXB5dGVyU2VydmVyLmNoaWxkUHJvY2Vzcy5raWxsKCdTSUdIVVAnKTtcbn1cblxuLyoqIFByb3h5IHRoaXMgc29ja2V0IHJlcXVlc3QgdG8ganVweXRlci4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVTb2NrZXQoXG4gICAgcmVxdWVzdDogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHNvY2tldDogbmV0LlNvY2tldCwgaGVhZDogQnVmZmVyKSB7XG4gIGlmICghanVweXRlclNlcnZlcikge1xuICAgIGxvZ2dpbmcuZ2V0TG9nZ2VyKCkuZXJyb3IoJ0p1cHl0ZXIgc2VydmVyIGlzIG5vdCBydW5uaW5nLicpO1xuICAgIHJldHVybjtcbiAgfVxuICBqdXB5dGVyU2VydmVyLnByb3h5LndzKHJlcXVlc3QsIHNvY2tldCwgaGVhZCk7XG59XG5cbi8qKiBQcm94eSB0aGlzIEhUVFAgcmVxdWVzdCB0byBqdXB5dGVyLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZVJlcXVlc3QoXG4gICAgcmVxdWVzdDogaHR0cC5JbmNvbWluZ01lc3NhZ2UsIHJlc3BvbnNlOiBodHRwLlNlcnZlclJlc3BvbnNlKSB7XG4gIGlmICghanVweXRlclNlcnZlcikge1xuICAgIHJlc3BvbnNlLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgcmVzcG9uc2UuZW5kKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAganVweXRlclNlcnZlci5wcm94eS53ZWIocmVxdWVzdCwgcmVzcG9uc2UsIG51bGwpO1xufVxuXG5mdW5jdGlvbiBlcnJvckhhbmRsZXIoXG4gICAgZXJyb3I6IEVycm9yLCByZXF1ZXN0OiBodHRwLkluY29taW5nTWVzc2FnZSxcbiAgICByZXNwb25zZTogaHR0cC5TZXJ2ZXJSZXNwb25zZSkge1xuICBsb2dnaW5nLmdldExvZ2dlcigpLmVycm9yKGVycm9yLCAnSnVweXRlciBzZXJ2ZXIgcmV0dXJuZWQgZXJyb3IuJyk7XG5cbiAgcmVzcG9uc2Uud3JpdGVIZWFkKDUwMCwgJ0ludGVybmFsIFNlcnZlciBFcnJvcicpO1xuICByZXNwb25zZS5lbmQoKTtcbn1cbiJdfQ==