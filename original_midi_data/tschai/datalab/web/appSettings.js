"use strict";
/*
 * Copyright 2018 Google Inc. All rights reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyEnvironmentVariables = applyEnvironmentVariables;
var environmentVariables = {
    'COLAB_ROOT_REDIRECT': function (settings, value) {
        settings.colabRedirect = value;
    },
    'COLAB_SERVER_PORT': function (settings, value) {
        settings.serverPort = Number(value);
    },
    'COLAB_LANGUAGE_SERVER_PROXY': function (settings, value) {
        settings.languageServerProxy = value;
    },
    'COLAB_SERVER_HOST': function (settings, value) {
        settings.serverHost = value;
    },
    'COLAB_NEXT_JUPYTER_PORT': function (settings, value) {
        settings.nextJupyterPort = Number(value);
    },
    'COLAB_DEBUG_ADAPTER_MUX_PATH': function (settings, value) {
        settings.debugAdapterMultiplexerPath = value;
    },
    'COLAB_DATALAB_ROOT': function (settings, value) {
        settings.datalabRoot = value;
    },
    'COLAB_KERNEL_MANAGER_PROXY_PORT': function (settings, value) {
        settings.kernelManagerProxyPort = Number(value);
    },
    'COLAB_KERNEL_MANAGER_PROXY_HOST': function (settings, value) {
        settings.kernelManagerProxyHost = value;
    },
    'COLAB_LANGUAGE_SERVER_PROXY_LSP_DIRS': function (settings, value) {
        settings.languageServerProxyArgs = settings.languageServerProxyArgs || [];
        settings.languageServerProxyArgs.push("--lsp_search_dirs=".concat(value));
    },
    'COLAB_LANGUAGE_SERVER_PROXY_ROOT_URL': function (settings, value) {
        settings.languageServerProxyArgs = settings.languageServerProxyArgs || [];
        settings.languageServerProxyArgs.push("--language_services_request_root_url=".concat(value));
    },
    'COLAB_LANGUAGE_SERVER_PROXY_REQUEST_TIMEOUT': function (settings, value) {
        settings.languageServerProxyArgs = settings.languageServerProxyArgs || [];
        settings.languageServerProxyArgs.push("--language_services_request_timeout=".concat(value));
    },
    'COLAB_JUPYTER_ALLOW_ORIGIN_PAT': function (settings, value) {
        settings.jupyterArgs = settings.jupyterArgs || [];
        settings.jupyterArgs.push("--NotebookApp.allow_origin_pat=\"".concat(value, "\""));
        settings.jupyterArgs.push("--NotebookApp.allow_origin=");
        settings.jupyterArgs.push("--NotebookApp.allow_credentials=True");
    },
    'COLAB_JUPYTER_DEBUG': function (settings) {
        settings.jupyterArgs = settings.jupyterArgs || [];
        settings.jupyterArgs.push("--debug");
    },
    'COLAB_JUPYTER_TRANSPORT': function (settings, value) {
        settings.jupyterArgs = settings.jupyterArgs || [];
        settings.jupyterArgs.push("--transport=\"".concat(value, "\""));
    },
    'COLAB_JUPYTER_IP': function (settings, value) {
        settings.jupyterArgs = settings.jupyterArgs || [];
        settings.jupyterArgs.push("--ip=".concat(value));
    },
    'COLAB_GATEWAY_CLIENT_URL': function (settings, value) {
        settings.jupyterArgs = settings.jupyterArgs || [];
        settings.jupyterArgs.push("--GatewayClient.url=".concat(value));
    },
    'COLAB_JUPYTER_ALLOW_REMOTE_ACCESS': function (settings, value) {
        settings.jupyterArgs = settings.jupyterArgs || [];
        settings.jupyterArgs.push("--NotebookApp.allow_remote_access=".concat(value));
    },
    'COLAB_JUPYTER_TOKEN': function (settings, value) {
        settings.jupyterArgs = settings.jupyterArgs || [];
        settings.jupyterArgs.push("--NotebookApp.token=".concat(value));
    },
    'COLAB_JUPYTER_DISABLE_CHECK_XSRF': function (settings, value) {
        settings.jupyterArgs = settings.jupyterArgs || [];
        settings.jupyterArgs.push("--NotebookApp.disable_check_xsrf=".concat(value));
    },
    'COLAB_FILE_HANDLER_ADDR': function (settings, value) {
        settings.fileHandlerAddr = value;
    },
};
/** Applies any environment variable overrides. */
function applyEnvironmentVariables(settings) {
    var e_1, _a;
    try {
        for (var _b = __values(Object.entries(environmentVariables)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var _d = __read(_c.value, 2), key = _d[0], apply = _d[1];
            var override = process.env[key];
            if (override !== undefined) {
                apply(settings, override);
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
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi90aGlyZF9wYXJ0eS9jb2xhYi9zb3VyY2VzL2FwcFNldHRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7Ozs7Ozs7R0FjRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzS0gsOERBT0M7QUE5RkQsSUFBTSxvQkFBb0IsR0FBRztJQUMzQixxQkFBcUIsRUFBRSxVQUFDLFFBQXFCLEVBQUUsS0FBYTtRQUMxRCxRQUFRLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztJQUNqQyxDQUFDO0lBQ0QsbUJBQW1CLEVBQUUsVUFBQyxRQUFxQixFQUFFLEtBQWE7UUFDeEQsUUFBUSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUNELDZCQUE2QixFQUFFLFVBQUMsUUFBcUIsRUFBRSxLQUFhO1FBQ2xFLFFBQVEsQ0FBQyxtQkFBbUIsR0FBRyxLQUFLLENBQUM7SUFDdkMsQ0FBQztJQUNELG1CQUFtQixFQUFFLFVBQUMsUUFBcUIsRUFBRSxLQUFhO1FBQ3hELFFBQVEsQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO0lBQzlCLENBQUM7SUFDRCx5QkFBeUIsRUFBRSxVQUFDLFFBQXFCLEVBQUUsS0FBYTtRQUM5RCxRQUFRLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBQ0QsOEJBQThCLEVBQUUsVUFBQyxRQUFxQixFQUFFLEtBQWE7UUFDbkUsUUFBUSxDQUFDLDJCQUEyQixHQUFHLEtBQUssQ0FBQztJQUMvQyxDQUFDO0lBQ0Qsb0JBQW9CLEVBQUUsVUFBQyxRQUFxQixFQUFFLEtBQWE7UUFDekQsUUFBUSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7SUFDL0IsQ0FBQztJQUNELGlDQUFpQyxFQUFFLFVBQUMsUUFBcUIsRUFBRSxL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LEVBQUUsS0FBYTtRQUMxRCxRQUFRLENBQUMsV0FBVyxHQUFHLFFBQVEsQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDO1FBQ2xELFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLDhCQUF1QixLQUFLLENBQUUsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFDRCxrQ0FBa0MsRUFDOUIsVUFBQyxRQUFxQixFQUFFLEtBQWE7UUFDbkMsUUFBUSxDQUFDLFdBQVcsR0FBRyxRQUFRLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQztRQUNsRCxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQywyQ0FBb0MsS0FBSyxDQUFFLENBQUMsQ0FBQztJQUN6RSxDQUFDO0lBQ0wseUJBQXlCLEVBQUUsVUFBQyxRQUFxQixFQUFFLEtBQWE7UUFDOUQsUUFBUSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7SUFDbkMsQ0FBQztDQUNGLENBQUM7QUFFRixrREFBa0Q7QUFDbEQsU0FBZ0IseUJBQXlCLENBQUMsUUFBcUI7OztRQUM3RCxLQUEyQixJQUFBLEtBQUEsU0FBQSxNQUFNLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUEsZ0JBQUEsNEJBQUUsQ0FBQztZQUF2RCxJQUFBLEtBQUEsbUJBQVksRUFBWCxHQUFHLFFBQUEsRUFBRSxLQUFLLFFBQUE7WUFDcEIsSUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNsQyxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDM0IsS0FBSyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM1QixDQUFDO1FBQ0gsQ0FBQzs7Ozs7Ozs7O0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxOCBHb29nbGUgSW5jLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7IHlvdSBtYXkgbm90XG4gKiB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZlxuICogdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsIFdJVEhPVVRcbiAqIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC4gU2VlIHRoZVxuICogTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmQgbGltaXRhdGlvbnMgdW5kZXJcbiAqIHRoZSBMaWNlbnNlLlxuICovXG5cblxuLyoqIENvbmZpZ3VyYXRpb24gdmFsdWVzIHNoYXJlZCBhY3Jvc3MgdGhlIHdob2xlIGFwcC4gKi9cbmV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBBcHBTZXR0aW5ncyB7XG4gIC8qKlxuICAgKiBUaGUgcG9ydCB0aGF0IHRoZSBzZXJ2ZXIgc2hvdWxkIGxpc3RlbiB0by5cbiAgICovXG4gIHNlcnZlclBvcnQ6IG51bWJlcjtcblxuICAvKipcbiAgICogSWYgc2V0LCBsaXN0ZW4gb24gdGhpcyBob3N0bmFtZS5cbiAgICovXG4gIHNlcnZlckhvc3Q/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBsaXN0IG9mIHN0YXRpYyBhcmd1bWVudHMgdG8gYmUgdXNlZCB3aGVuIGxhdW5jaGluZyBganVweXRlciBub3RlYm9va2AuXG4gICAqL1xuICBqdXB5dGVyQXJncz86IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBJZiBwcm92aWRlZCwgdXNlIHRoaXMgYXMgYSBwcmVmaXggdG8gYWxsIGZpbGUgcGF0aHMgb3BlbmVkIG9uIHRoZVxuICAgKiBzZXJ2ZXIgc2lkZS4gVXNlZnVsIGZvciB0ZXN0aW5nIG91dHNpZGUgYSBEb2NrZXIgY29udGFpbmVyLlxuICAgKi9cbiAgZGF0YWxhYlJvb3Q6IHN0cmluZztcblxuICAvKipcbiAgICogSW5pdGlhbCBwb3J0IHRvIHVzZSB3aGVuIHNlYXJjaGluZyBmb3IgYSBmcmVlIEp1cHl0ZXIgcG9ydC5cbiAgICovXG4gIG5leHRKdXB5dGVyUG9ydDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBMb2NhbCBkaXJlY3Rvcnkgd2hlcmUga2VybmVscyBhcmUgc3RhcnRlZC5cbiAgICovXG4gIGNvbnRlbnREaXI6IHN0cmluZztcblxuICAvKipcbiAgICogVGhlIHBvcnQgdG8gdXNlIHRvIHByb3h5IGtlcm5lbCBtYW5hZ2VyIHdlYnNvY2tldCByZXF1ZXN0cy4gQSB2YWx1ZSBvZiAwXG4gICAqIGRpc2FibGVzIHByb3h5aW5nLlxuICAgKi9cbiAga2VybmVsTWFuYWdlclByb3h5UG9ydDogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgaG9zdG5hbWUgKG9yIElQKSB0byB1c2UgdG8gcHJveHkga2VybmVsIG1hbmFnZXIgd2Vic29ja2V0IHJlcXVlc3RzLlxuICAgKiBBbiBlbXB0eSB2YWx1ZSB1c2VzIGxvY2FsaG9zdC5cbiAgICovXG4gIGtlcm5lbE1hbmFnZXJQcm94eUhvc3Q6IHN0cmluZztcblxuICAvKipcbiAgICogSWYgc2V0LCB0aGUgcGF0aCB0byB0aGUgREFQIG11bHRpcGxleGVyLlxuICAgKi9cbiAgZGVidWdBZGFwdGVyTXVsdGlwbGV4ZXJQYXRoOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIElmIHNldCwgcmVkaXJlY3QgLyByZXF1ZXN0cyB0byBDb2xhYiwgd2l0aCB7anVweXRlcl9ob3N0fSByZXBsYWNlZCB3aXRoIHRoZVxuICAgKiBzZXJ2ZXIgaG9zdC5cbiAgICovXG4gIGNvbGFiUmVkaXJlY3Q/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIElmIHNldCwgdGhlIHBhdGggYSBsYW5ndWFnZSBzZXJ2ZXIgcHJveHkgd2hpY2ggY2FuIGV4dGVuZCB0aGUgY2FwYWJpbGl0aWVzXG4gICAqIG9mIHRoZSBkZWZhdWx0IGxhbmd1YWdlIHNlcnZlci5cbiAgICovXG4gIGxhbmd1YWdlU2VydmVyUHJveHk/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIElmIHNldCwgdGhlIGFyZ3MgdG8gcGFzcyB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHByb3h5LlxuICAgKiBUaGlzIGlzIG9ubHkgY29uc3VtZWQgaWYgYSBub24tZW1wdHkgcGF0aCBpcyBzZXQgZm9yIHRoZVxuICAgKiBsYW5ndWFnZVNlcnZlclByb3h5IHNldHRpbmcuXG4gICAqL1xuICBsYW5ndWFnZVNlcnZlclByb3h5QXJncz86IHN0cmluZ1tdO1xuXG4gIC8qKlxuICAgKiBUaGUgaG9zdDpwb3J0IGFkZHJlc3MgdG8gdXNlIGZvciBzZXJ2aW5nIGZpbGUgcmVxdWVzdHMuIEFuIGVtcHR5IHZhbHVlIHVzZXNcbiAgICogSnVweXRlcidzIGZpbGUgc2VydmVyLlxuICAgKi9cbiAgZmlsZUhhbmRsZXJBZGRyOiBzdHJpbmc7XG59XG5cbmNvbnN0IGVudmlyb25tZW50VmFyaWFibGVzID0ge1xuICAnQ09MQUJfUk9PVF9SRURJUkVDVCc6IChzZXR0aW5nczogQXBwU2V0dGluZ3MsIHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICBzZXR0aW5ncy5jb2xhYlJlZGlyZWN0ID0gdmFsdWU7XG4gIH0sXG4gICdDT0xBQl9TRVJWRVJfUE9SVCc6IChzZXR0aW5nczogQXBwU2V0dGluZ3MsIHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICBzZXR0aW5ncy5zZXJ2ZXJQb3J0ID0gTnVtYmVyKHZhbHVlKTtcbiAgfSxcbiAgJ0NPTEFCX0xBTkdVQUdFX1NFUlZFUl9QUk9YWSc6IChzZXR0aW5nczogQXBwU2V0dGluZ3MsIHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICBzZXR0aW5ncy5sYW5ndWFnZVNlcnZlclByb3h5ID0gdmFsdWU7XG4gIH0sXG4gICdDT0xBQl9TRVJWRVJfSE9TVCc6IChzZXR0aW5nczogQXBwU2V0dGluZ3MsIHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICBzZXR0aW5ncy5zZXJ2ZXJIb3N0ID0gdmFsdWU7XG4gIH0sXG4gICdDT0xBQl9ORVhUX0pVUFlURVJfUE9SVCc6IChzZXR0aW5nczogQXBwU2V0dGluZ3MsIHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICBzZXR0aW5ncy5uZXh0SnVweXRlclBvcnQgPSBOdW1iZXIodmFsdWUpO1xuICB9LFxuICAnQ09MQUJfREVCVUdfQURBUFRFUl9NVVhfUEFUSCc6IChzZXR0aW5nczogQXBwU2V0dGluZ3MsIHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICBzZXR0aW5ncy5kZWJ1Z0FkYXB0ZXJNdWx0aXBsZXhlclBhdGggPSB2YWx1ZTtcbiAgfSxcbiAgJ0NPTEFCX0RBVEFMQUJfUk9PVCc6IChzZXR0aW5nczogQXBwU2V0dGluZ3MsIHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICBzZXR0aW5ncy5kYXRhbGFiUm9vdCA9IHZhbHVlO1xuICB9LFxuICAnQ09MQUJfS0VSTkVMX01BTkFHRVJfUFJPWFlfUE9SVCc6IChzZXR0aW5nczogQXBwU2V0dGluZ3MsIHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICBzZXR0aW5ncy5rZXJuZWxNYW5hZ2VyUHJveHlQb3J0ID0gTnVtYmVyKHZhbHVlKTtcbiAgfSxcbiAgJ0NPTEFCX0tFUk5FTF9NQU5BR0VSX1BST1hZX0hPU1QnOiAoc2V0dGluZ3M6IEFwcFNldHRpbmdzLCB2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgc2V0dGluZ3Mua2VybmVsTWFuYWdlclByb3h5SG9zdCA9IHZhbHVlO1xuICB9LFxuICAnQ09MQUJfTEFOR1VBR0VfU0VSVkVSX1BST1hZX0xTUF9ESVJTJzogKFxuICAgICAgc2V0dGluZ3M6IEFwcFNldHRpbmdzLCB2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgc2V0dGluZ3MubGFuZ3VhZ2VTZXJ2ZXJQcm94eUFyZ3MgPSBzZXR0aW5ncy5sYW5ndWFnZVNlcnZlclByb3h5QXJncyB8fCBbXTtcbiAgICBzZXR0aW5ncy5sYW5ndWFnZVNlcnZlclByb3h5QXJncy5wdXNoKGAtLWxzcF9zZWFyY2hfZGlycz0ke3ZhbHVlfWApO1xuICB9LFxuICAnQ09MQUJfTEFOR1VBR0VfU0VSVkVSX1BST1hZX1JPT1RfVVJMJzogKFxuICAgICAgc2V0dGluZ3M6IEFwcFNldHRpbmdzLCB2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgc2V0dGluZ3MubGFuZ3VhZ2VTZXJ2ZXJQcm94eUFyZ3MgPSBzZXR0aW5ncy5sYW5ndWFnZVNlcnZlclByb3h5QXJncyB8fCBbXTtcbiAgICBzZXR0aW5ncy5sYW5ndWFnZVNlcnZlclByb3h5QXJncy5wdXNoKFxuICAgICAgICBgLS1sYW5ndWFnZV9zZXJ2aWNlc19yZXF1ZXN0X3Jvb3RfdXJsPSR7dmFsdWV9YCk7XG4gIH0sXG4gICdDT0xBQl9MQU5HVUFHRV9TRVJWRVJfUFJPWFlfUkVRVUVTVF9USU1FT1VUJzogKFxuICAgICAgc2V0dGluZ3M6IEFwcFNldHRpbmdzLCB2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgc2V0dGluZ3MubGFuZ3VhZ2VTZXJ2ZXJQcm94eUFyZ3MgPSBzZXR0aW5ncy5sYW5ndWFnZVNlcnZlclByb3h5QXJncyB8fCBbXTtcbiAgICBzZXR0aW5ncy5sYW5ndWFnZVNlcnZlclByb3h5QXJncy5wdXNoKFxuICAgICAgICBgLS1sYW5ndWFnZV9zZXJ2aWNlc19yZXF1ZXN0X3RpbWVvdXQ9JHt2YWx1ZX1gKTtcbiAgfSxcbiAgJ0NPTEFCX0pVUFlURVJfQUxMT1dfT1JJR0lOX1BBVCc6IChzZXR0aW5nczogQXBwU2V0dGluZ3MsIHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICBzZXR0aW5ncy5qdXB5dGVyQXJncyA9IHNldHRpbmdzLmp1cHl0ZXJBcmdzIHx8IFtdO1xuICAgIHNldHRpbmdzLmp1cHl0ZXJBcmdzLnB1c2goYC0tTm90ZWJvb2tBcHAuYWxsb3dfb3JpZ2luX3BhdD1cIiR7dmFsdWV9XCJgKTtcbiAgICBzZXR0aW5ncy5qdXB5dGVyQXJncy5wdXNoKGAtLU5vdGVib29rQXBwLmFsbG93X29yaWdpbj1gKTtcbiAgICBzZXR0aW5ncy5qdXB5dGVyQXJncy5wdXNoKGAtLU5vdGVib29rQXBwLmFsbG93X2NyZWRlbnRpYWxzPVRydWVgKTtcbiAgfSxcbiAgJ0NPTEFCX0pVUFlURVJfREVCVUcnOiAoc2V0dGluZ3M6IEFwcFNldHRpbmdzKSA9PiB7XG4gICAgc2V0dGluZ3MuanVweXRlckFyZ3MgPSBzZXR0aW5ncy5qdXB5dGVyQXJncyB8fCBbXTtcbiAgICBzZXR0aW5ncy5qdXB5dGVyQXJncy5wdXNoKGAtLWRlYnVnYCk7XG4gIH0sXG4gICdDT0xBQl9KVVBZVEVSX1RSQU5TUE9SVCc6IChzZXR0aW5nczogQXBwU2V0dGluZ3MsIHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICBzZXR0aW5ncy5qdXB5dGVyQXJncyA9IHNldHRpbmdzLmp1cHl0ZXJBcmdzIHx8IFtdO1xuICAgIHNldHRpbmdzLmp1cHl0ZXJBcmdzLnB1c2goYC0tdHJhbnNwb3J0PVwiJHt2YWx1ZX1cImApO1xuICB9LFxuICAnQ09MQUJfSlVQWVRFUl9JUCc6IChzZXR0aW5nczogQXBwU2V0dGluZ3MsIHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICBzZXR0aW5ncy5qdXB5dGVyQXJncyA9IHNldHRpbmdzLmp1cHl0ZXJBcmdzIHx8IFtdO1xuICAgIHNldHRpbmdzLmp1cHl0ZXJBcmdzLnB1c2goYC0taXA9JHt2YWx1ZX1gKTtcbiAgfSxcbiAgJ0NPTEFCX0dBVEVXQVlfQ0xJRU5UX1VSTCc6IChzZXR0aW5nczogQXBwU2V0dGluZ3MsIHZhbHVlOiBzdHJpbmcpID0+IHtcbiAgICBzZXR0aW5ncy5qdXB5dGVyQXJncyA9IHNldHRpbmdzLmp1cHl0ZXJBcmdzIHx8IFtdO1xuICAgIHNldHRpbmdzLmp1cHl0ZXJBcmdzLnB1c2goYC0tR2F0ZXdheUNsaWVudC51cmw9JHt2YWx1ZX1gKTtcbiAgfSxcbiAgJ0NPTEFCX0pVUFlURVJfQUxMT1dfUkVNT1RFX0FDQ0VTUyc6XG4gICAgICAoc2V0dGluZ3M6IEFwcFNldHRpbmdzLCB2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHNldHRpbmdzLmp1cHl0ZXJBcmdzID0gc2V0dGluZ3MuanVweXRlckFyZ3MgfHwgW107XG4gICAgICAgIHNldHRpbmdzLmp1cHl0ZXJBcmdzLnB1c2goYC0tTm90ZWJvb2tBcHAuYWxsb3dfcmVtb3RlX2FjY2Vzcz0ke3ZhbHVlfWApO1xuICAgICAgfSxcbiAgJ0NPTEFCX0pVUFlURVJfVE9LRU4nOiAoc2V0dGluZ3M6IEFwcFNldHRpbmdzLCB2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgc2V0dGluZ3MuanVweXRlckFyZ3MgPSBzZXR0aW5ncy5qdXB5dGVyQXJncyB8fCBbXTtcbiAgICBzZXR0aW5ncy5qdXB5dGVyQXJncy5wdXNoKGAtLU5vdGVib29rQXBwLnRva2VuPSR7dmFsdWV9YCk7XG4gIH0sXG4gICdDT0xBQl9KVVBZVEVSX0RJU0FCTEVfQ0hFQ0tfWFNSRic6XG4gICAgICAoc2V0dGluZ3M6IEFwcFNldHRpbmdzLCB2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIHNldHRpbmdzLmp1cHl0ZXJBcmdzID0gc2V0dGluZ3MuanVweXRlckFyZ3MgfHwgW107XG4gICAgICAgIHNldHRpbmdzLmp1cHl0ZXJBcmdzLnB1c2goYC0tTm90ZWJvb2tBcHAuZGlzYWJsZV9jaGVja194c3JmPSR7dmFsdWV9YCk7XG4gICAgICB9LFxuICAnQ09MQUJfRklMRV9IQU5ETEVSX0FERFInOiAoc2V0dGluZ3M6IEFwcFNldHRpbmdzLCB2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgc2V0dGluZ3MuZmlsZUhhbmRsZXJBZGRyID0gdmFsdWU7XG4gIH0sXG59O1xuXG4vKiogQXBwbGllcyBhbnkgZW52aXJvbm1lbnQgdmFyaWFibGUgb3ZlcnJpZGVzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5RW52aXJvbm1lbnRWYXJpYWJsZXMoc2V0dGluZ3M6IEFwcFNldHRpbmdzKSB7XG4gIGZvciAoY29uc3QgW2tleSwgYXBwbHldIG9mIE9iamVjdC5lbnRyaWVzKGVudmlyb25tZW50VmFyaWFibGVzKSkge1xuICAgIGNvbnN0IG92ZXJyaWRlID0gcHJvY2Vzcy5lbnZba2V5XTtcbiAgICBpZiAob3ZlcnJpZGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXBwbHkoc2V0dGluZ3MsIG92ZXJyaWRlKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==