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
exports.getLogger = getLogger;
exports.getJupyterLogger = getJupyterLogger;
exports.logRequest = logRequest;
exports.initializeLoggers = initializeLoggers;
var bunyan = require("bunyan");
var path = require("path");
// We import the bunyan-rotating-file-stream package, which exports a
// constructor as a single object; we use lint disables here to make the usage
// below look reasonable.
//
// tslint:disable-next-line:no-require-imports variable-name enforce-name-casing
var RotatingFileStream = require('bunyan-rotating-file-stream');
var logger = null;
var requestLogger = null;
var jupyterLogger = null;
/**
 * Gets the logger for generating debug logs.
 * @returns the logger configured for debugging logging.
 */
function getLogger() {
    return logger;
}
/**
 * Gets the logger for generating Jupyter logs.
 * @returns the logger configured for Jupyter logging.
 */
function getJupyterLogger() {
    return jupyterLogger;
}
/**
 * Logs a request and the corresponding response.
 * @param request the request to be logged.
 * @param response the response to be logged.
 */
function logRequest(request, response) {
    requestLogger.debug({ url: request.url, method: request.method }, 'Received a new request');
    response.on('finish', function () {
        requestLogger.debug({
            url: request.url,
            method: request.method,
            status: response.statusCode
        });
    });
}
/**
 * Initializes loggers used within the application.
 */
function initializeLoggers(settings) {
    var e_1, _a;
    // We configure our loggers as follows:
    //  * our base logger tags all log records with `"name":"app"`, and sends logs
    //    to stderr (including logs of all children)
    //  * one child logger adds `"type":"request"`, and records method/URL for all
    //    HTTP requests to the app, and method/URL/response code for all responses
    //  * one child logger adds `"type":"jupyter"`, and records all messages from
    //    the jupyter notebook server. These logs are also sent to a file on disk
    //    (to assist user debugging).
    //
    // For more about bunyan, see:
    //   https://github.com/trentm/node-bunyan/tree/f21007d46c0e64072617380b70d3f542368318a8
    var jupyterLogPath = path.join(settings.datalabRoot, '/var/colab/app.log');
    logger = bunyan.createLogger({
        name: 'app',
        streams: [
            { level: 'debug', type: 'stream', stream: process.stderr },
        ]
    });
    requestLogger = logger.child({ type: 'request' });
    jupyterLogger = logger.child({
        type: 'jupyter',
        streams: [{
                level: 'info',
                type: 'stream',
                stream: new RotatingFileStream({
                    path: jupyterLogPath,
                    rotateExisting: false,
                    threshold: '2m',
                    totalSize: '20m'
                }),
            }]
    });
    // Omit superfluous fields, unless using the bunyan CLI to make logs human
    // readable, because the CLI requires them.
    if (process.env['COLAB_HUMAN_READABLE_NODE_LOGS'] !== '1') {
        try {
            for (var _b = __values([logger, jupyterLogger, requestLogger]), _c = _b.next(); !_c.done; _c = _b.next()) {
                var logs = _c.value;
                delete logs.fields['hostname'];
                delete logs.fields['name'];
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2luZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3RoaXJkX3BhcnR5L2NvbGFiL3NvdXJjZXMvbG9nZ2luZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7Ozs7O0dBY0c7Ozs7Ozs7Ozs7Ozs7QUF1QkgsOEJBRUM7QUFNRCw0Q0FFQztBQU9ELGdDQVdDO0FBS0QsOENBeUNDO0FBL0ZELCtCQUFpQztBQUVqQywyQkFBNkI7QUFJN0IscUVBQXFFO0FBQ3JFLDhFQUE4RTtBQUM5RSx5QkFBeUI7QUFDekIsRUFBRTtBQUNGLGdGQUFnRjtBQUNoRixJQUFNLGtCQUFrQixHQUFHLE9BQU8sQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO0FBRWxFLElBQUksTUFBTSxHQUF3QixJQUFJLENBQUM7QUFDdkMsSUFBSSxhQUFhLEdBQXdCLElBQUksQ0FBQztBQUM5QyxJQUFJLGFBQWEsR0FBd0IsSUFBSSxDQUFDO0FBRTlDOzs7R0FHRztBQUNILFNBQWdCLFNBQVM7SUFDdkIsT0FBTyxNQUFPLENBQUM7QUFDakIsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLGdCQUFnQjtJQUM5QixPQUFPLGFBQWMsQ0FBQztBQUN4QixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQWdCLFVBQVUsQ0FDdEIsT0FBNkIsRUFBRSxRQUE2QjtJQUM5RCxhQUFjLENBQUMsS0FBSyxDQUNoQixFQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxFQUFDLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztJQUMxRSxRQUFRLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRTtRQUNwQixhQUFjLENBQUMsS0FBSyxDQUFDO1lBQ25CLEdBQUcsRUFBRSxPQUFPLENBQUMsR0FBRztZQUNoQixNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07WUFDdEIsTUFBTSxFQUFFLFFBQVEsQ0FBQyxVQUFVO1NBQzVCLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsUUFBcUI7O0lBQ3JELHVDQUF1QztJQUN2Qyw4RUFBOEU7SUFDOUUsZ0RBQWdEO0lBQ2hELDhFQUE4RTtJQUM5RSw4RUFBOEU7SUFDOUUsNkVBQTZFO0lBQzdFLDZFQUE2RTtJQUM3RSxpQ0FBaUM7SUFDakMsRUFBRTtJQUNGLDhCQUE4QjtJQUM5Qix3RkFBd0Y7SUFDeEYsSUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLG9CQUFvQixDQUFDLENBQUM7SUFDN0UsTUFBTSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUM7UUFDM0IsSUFBSSxFQUFFLEtBQUs7UUFDWCxPQUFPLEVBQUU7WUFDUCxFQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU0sRUFBQztTQUN6RDtLQUNGLENBQUMsQ0FBQztJQUNILGFBQWEsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBQyxDQUFDLENBQUM7SUFDaEQsYUFBYSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDM0IsSUFBSSxFQUFFLFNBQVM7UUFDZixPQUFPLEVBQUUsQ0FBQztnQkFDUixLQUFLLEVBQUUsTUFBTTtnQkFDYixJQUFJLEVBQUUsUUFBUTtnQkFDZCxNQUFNLEVBQUUsSUFBSSxrQkFBa0IsQ0FBQztvQkFDN0IsSUFBSSxFQUFFLGNBQWM7b0JBQ3BCLGNBQWMsRUFBRSxLQUFLO29CQUNyQixTQUFTLEVBQUUsSUFBSTtvQkFDZixTQUFTLEVBQUUsS0FBSztpQkFDakIsQ0FBQzthQUNILENBQUM7S0FDSCxDQUFDLENBQUM7SUFDSCwwRUFBMEU7SUFDMUUsMkNBQTJDO0lBQzNDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQ0FBZ0MsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDOztZQUMxRCxLQUFtQixJQUFBLEtBQUEsU0FBQSxDQUFDLE1BQU0sRUFBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLENBQUEsZ0JBQUEsNEJBQUUsQ0FBQztnQkFBdkQsSUFBTSxJQUFJLFdBQUE7Z0JBQ2IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUMvQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDN0IsQ0FBQzs7Ozs7Ozs7O0lBQ0gsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpOyB5b3UgbWF5IG5vdFxuICogdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2ZcbiAqIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLCBXSVRIT1VUXG4gKiBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuIFNlZSB0aGVcbiAqIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kIGxpbWl0YXRpb25zIHVuZGVyXG4gKiB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgKiBhcyBidW55YW4gZnJvbSAnYnVueWFuJztcbmltcG9ydCAqIGFzIGh0dHAgZnJvbSAnaHR0cCc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5pbXBvcnQge0FwcFNldHRpbmdzfSBmcm9tICcuL2FwcFNldHRpbmdzJztcblxuLy8gV2UgaW1wb3J0IHRoZSBidW55YW4tcm90YXRpbmctZmlsZS1zdHJlYW0gcGFja2FnZSwgd2hpY2ggZXhwb3J0cyBhXG4vLyBjb25zdHJ1Y3RvciBhcyBhIHNpbmdsZSBvYmplY3Q7IHdlIHVzZSBsaW50IGRpc2FibGVzIGhlcmUgdG8gbWFrZSB0aGUgdXNhZ2Vcbi8vIGJlbG93IGxvb2sgcmVhc29uYWJsZS5cbi8vXG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tcmVxdWlyZS1pbXBvcnRzIHZhcmlhYmxlLW5hbWUgZW5mb3JjZS1uYW1lLWNhc2luZ1xuY29uc3QgUm90YXRpbmdGaWxlU3RyZWFtID0gcmVxdWlyZSgnYnVueWFuLXJvdGF0aW5nLWZpbGUtc3RyZWFtJyk7XG5cbmxldCBsb2dnZXI6IGJ1bnlhbi5JTG9nZ2VyfG51bGwgPSBudWxsO1xubGV0IHJlcXVlc3RMb2dnZXI6IGJ1bnlhbi5JTG9nZ2VyfG51bGwgPSBudWxsO1xubGV0IGp1cHl0ZXJMb2dnZXI6IGJ1bnlhbi5JTG9nZ2VyfG51bGwgPSBudWxsO1xuXG4vKipcbiAqIEdldHMgdGhlIGxvZ2dlciBmb3IgZ2VuZXJhdGluZyBkZWJ1ZyBsb2dzLlxuICogQHJldHVybnMgdGhlIGxvZ2dlciBjb25maWd1cmVkIGZvciBkZWJ1Z2dpbmcgbG9nZ2luZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExvZ2dlcigpOiBidW55YW4uSUxvZ2dlciB7XG4gIHJldHVybiBsb2dnZXIhO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGxvZ2dlciBmb3IgZ2VuZXJhdGluZyBKdXB5dGVyIGxvZ3MuXG4gKiBAcmV0dXJucyB0aGUgbG9nZ2VyIGNvbmZpZ3VyZWQgZm9yIEp1cHl0ZXIgbG9nZ2luZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEp1cHl0ZXJMb2dnZXIoKTogYnVueWFuLklMb2dnZXIge1xuICByZXR1cm4ganVweXRlckxvZ2dlciE7XG59XG5cbi8qKlxuICogTG9ncyBhIHJlcXVlc3QgYW5kIHRoZSBjb3JyZXNwb25kaW5nIHJlc3BvbnNlLlxuICogQHBhcmFtIHJlcXVlc3QgdGhlIHJlcXVlc3QgdG8gYmUgbG9nZ2VkLlxuICogQHBhcmFtIHJlc3BvbnNlIHRoZSByZXNwb25zZSB0byBiZSBsb2dnZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2dSZXF1ZXN0KFxuICAgIHJlcXVlc3Q6IGh0dHAuSW5jb21pbmdNZXNzYWdlLCByZXNwb25zZTogaHR0cC5TZXJ2ZXJSZXNwb25zZSk6IHZvaWQge1xuICByZXF1ZXN0TG9nZ2VyIS5kZWJ1ZyhcbiAgICAgIHt1cmw6IHJlcXVlc3QudXJsLCBtZXRob2Q6IHJlcXVlc3QubWV0aG9kfSwgJ1JlY2VpdmVkIGEgbmV3IHJlcXVlc3QnKTtcbiAgcmVzcG9uc2Uub24oJ2ZpbmlzaCcsICgpID0+IHtcbiAgICByZXF1ZXN0TG9nZ2VyIS5kZWJ1Zyh7XG4gICAgICB1cmw6IHJlcXVlc3QudXJsLFxuICAgICAgbWV0aG9kOiByZXF1ZXN0Lm1ldGhvZCxcbiAgICAgIHN0YXR1czogcmVzcG9uc2Uuc3RhdHVzQ29kZVxuICAgIH0pO1xuICB9KTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplcyBsb2dnZXJzIHVzZWQgd2l0aGluIHRoZSBhcHBsaWNhdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVMb2dnZXJzKHNldHRpbmdzOiBBcHBTZXR0aW5ncyk6IHZvaWQge1xuICAvLyBXZSBjb25maWd1cmUgb3VyIGxvZ2dlcnMgYXMgZm9sbG93czpcbiAgLy8gICogb3VyIGJhc2UgbG9nZ2VyIHRhZ3MgYWxsIGxvZyByZWNvcmRzIHdpdGggYFwibmFtZVwiOlwiYXBwXCJgLCBhbmQgc2VuZHMgbG9nc1xuICAvLyAgICB0byBzdGRlcnIgKGluY2x1ZGluZyBsb2dzIG9mIGFsbCBjaGlsZHJlbilcbiAgLy8gICogb25lIGNoaWxkIGxvZ2dlciBhZGRzIGBcInR5cGVcIjpcInJlcXVlc3RcImAsIGFuZCByZWNvcmRzIG1ldGhvZC9VUkwgZm9yIGFsbFxuICAvLyAgICBIVFRQIHJlcXVlc3RzIHRvIHRoZSBhcHAsIGFuZCBtZXRob2QvVVJML3Jlc3BvbnNlIGNvZGUgZm9yIGFsbCByZXNwb25zZXNcbiAgLy8gICogb25lIGNoaWxkIGxvZ2dlciBhZGRzIGBcInR5cGVcIjpcImp1cHl0ZXJcImAsIGFuZCByZWNvcmRzIGFsbCBtZXNzYWdlcyBmcm9tXG4gIC8vICAgIHRoZSBqdXB5dGVyIG5vdGVib29rIHNlcnZlci4gVGhlc2UgbG9ncyBhcmUgYWxzbyBzZW50IHRvIGEgZmlsZSBvbiBkaXNrXG4gIC8vICAgICh0byBhc3Npc3QgdXNlciBkZWJ1Z2dpbmcpLlxuICAvL1xuICAvLyBGb3IgbW9yZSBhYm91dCBidW55YW4sIHNlZTpcbiAgLy8gICBodHRwczovL2dpdGh1Yi5jb20vdHJlbnRtL25vZGUtYnVueWFuL3RyZWUvZjIxMDA3ZDQ2YzBlNjQwNzI2MTczODBiNzBkM2Y1NDIzNjgzMThhOFxuICBjb25zdCBqdXB5dGVyTG9nUGF0aCA9IHBhdGguam9pbihzZXR0aW5ncy5kYXRhbGFiUm9vdCwgJy92YXIvY29sYWIvYXBwLmxvZycpO1xuICBsb2dnZXIgPSBidW55YW4uY3JlYXRlTG9nZ2VyKHtcbiAgICBuYW1lOiAnYXBwJyxcbiAgICBzdHJlYW1zOiBbXG4gICAgICB7bGV2ZWw6ICdkZWJ1ZycsIHR5cGU6ICdzdHJlYW0nLCBzdHJlYW06IHByb2Nlc3Muc3RkZXJyfSxcbiAgICBdXG4gIH0pO1xuICByZXF1ZXN0TG9nZ2VyID0gbG9nZ2VyLmNoaWxkKHt0eXBlOiAncmVxdWVzdCd9KTtcbiAganVweXRlckxvZ2dlciA9IGxvZ2dlci5jaGlsZCh7XG4gICAgdHlwZTogJ2p1cHl0ZXInLFxuICAgIHN0cmVhbXM6IFt7XG4gICAgICBsZXZlbDogJ2luZm8nLFxuICAgICAgdHlwZTogJ3N0cmVhbScsXG4gICAgICBzdHJlYW06IG5ldyBSb3RhdGluZ0ZpbGVTdHJlYW0oe1xuICAgICAgICBwYXRoOiBqdXB5dGVyTG9nUGF0aCxcbiAgICAgICAgcm90YXRlRXhpc3Rpbmc6IGZhbHNlLFxuICAgICAgICB0aHJlc2hvbGQ6ICcybScsXG4gICAgICAgIHRvdGFsU2l6ZTogJzIwbSdcbiAgICAgIH0pLFxuICAgIH1dXG4gIH0pO1xuICAvLyBPbWl0IHN1cGVyZmx1b3VzIGZpZWxkcywgdW5sZXNzIHVzaW5nIHRoZSBidW55YW4gQ0xJIHRvIG1ha2UgbG9ncyBodW1hblxuICAvLyByZWFkYWJsZSwgYmVjYXVzZSB0aGUgQ0xJIHJlcXVpcmVzIHRoZW0uXG4gIGlmIChwcm9jZXNzLmVudlsnQ09MQUJfSFVNQU5fUkVBREFCTEVfTk9ERV9MT0dTJ10gIT09ICcxJykge1xuICAgIGZvciAoY29uc3QgbG9ncyBvZiBbbG9nZ2VyLCBqdXB5dGVyTG9nZ2VyLCByZXF1ZXN0TG9nZ2VyXSkge1xuICAgICAgZGVsZXRlIGxvZ3MuZmllbGRzWydob3N0bmFtZSddO1xuICAgICAgZGVsZXRlIGxvZ3MuZmllbGRzWyduYW1lJ107XG4gICAgfVxuICB9XG59XG4iXX0=