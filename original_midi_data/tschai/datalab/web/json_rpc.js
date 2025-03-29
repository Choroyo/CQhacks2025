"use strict";
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
exports.JsonRpcReader = void 0;
exports.encodeJsonRpc = encodeJsonRpc;
var CR = 13;
var LF = 10;
/**
 * JSON RPC reader following the Debug Adapter Protocol message
 * format which itself follows Chrome's V8 debugger protocol, originally
 * documented at
 * https://github.com/buggerjs/bugger-v8-client/blob/master/PROTOCOL.md#v8-debugger-protocol
 */
var JsonRpcReader = /** @class */ (function () {
    function JsonRpcReader(callback) {
        this.callback = callback;
        this.position = 0;
        this.allocationSize = 4096;
        this.decoder = new TextDecoder();
        this.buffer = new Uint8Array(this.allocationSize);
    }
    JsonRpcReader.prototype.append = function (data) {
        // Grow the buffer if necessary to hold the data.
        if (data.byteLength > (this.buffer.byteLength - this.position)) {
            var requiredSize = this.position + data.byteLength;
            var newSize = Math.ceil(requiredSize / this.allocationSize) * this.allocationSize;
            var newBuffer = new Uint8Array(newSize);
            newBuffer.set(this.buffer, 0);
            this.buffer = newBuffer;
        }
        // Push new data onto end of the buffer.
        this.buffer.set(data, this.position);
        this.position += data.byteLength;
        var parsedMessages = [];
        while (true) {
            // Parse all messages out of the buffer.
            var message = this.tryReadMessage();
            if (!message) {
                break;
            }
            parsedMessages.push(message);
            this.callback(message);
        }
        return parsedMessages;
    };
    JsonRpcReader.prototype.tryReadMessage = function () {
        var e_1, _a;
        // Loop through looking for \r\n\r\n in the buffer.
        for (var i = 0; i < this.position - 4; ++i) {
            // First \r\n indicates the end of the headers.
            if (this.buffer[i] === CR && this.buffer[i + 1] === LF &&
                this.buffer[i + 2] === CR && this.buffer[i + 3] === LF) {
                // Parse each of the header lines out of the header block.
                var headerLength = i + 4;
                var headerBytes = this.buffer.subarray(0, headerLength);
                var headerString = this.decoder.decode(headerBytes);
                var headerLines = headerString.split('\r\n');
                var headers = {};
                try {
                    for (var headerLines_1 = (e_1 = void 0, __values(headerLines)), headerLines_1_1 = headerLines_1.next(); !headerLines_1_1.done; headerLines_1_1 = headerLines_1.next()) {
                        var line = headerLines_1_1.value;
                        if (!line.trim()) {
                            continue;
                        }
                        var pair = line.split(':');
                        if (pair.length !== 2) {
                            throw new Error("Illegal header value: ".concat(line));
                        }
                        headers[pair[0]] = pair[1].trim();
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (headerLines_1_1 && !headerLines_1_1.done && (_a = headerLines_1.return)) _a.call(headerLines_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                var contentLengthString = headers['Content-Length'];
                if (!contentLengthString) {
                    throw new Error('Missing Content-Length header.');
                }
                var contentLength = Number(contentLengthString);
                if (isNaN(contentLength)) {
                    throw new Error("Header Content-Length not a number: ".concat(contentLengthString, "."));
                }
                var requiredLength = headerLength + contentLength;
                if (requiredLength <= this.position) {
                    // This is just a view onto the current buffer.
                    var contentBytes = this.buffer.subarray(headerLength, headerLength + contentLength);
                    var content = this.decoder.decode(contentBytes);
                    this.buffer.copyWithin(0, headerLength + contentLength, this.position);
                    this.position = this.position - (headerLength + contentLength);
                    return { headers: headers, content: content };
                }
            }
        }
        return null;
    };
    return JsonRpcReader;
}());
exports.JsonRpcReader = JsonRpcReader;
/** Encodes the string content to a JSON RPC message. */
function encodeJsonRpc(content) {
    var e_2, _a;
    var headers = {
        'Content-Length': String(new TextEncoder().encode(content).byteLength),
    };
    var requestString = '';
    try {
        for (var _b = __values(Object.keys(headers)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var key = _c.value;
            requestString += "".concat(key, ": ").concat(headers[key], "\r\n");
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_2) throw e_2.error; }
    }
    requestString += '\r\n';
    requestString += content;
    return requestString;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbl9ycGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi90aGlyZF9wYXJ0eS9jb2xhYi9zb3VyY2VzL2pzb25fcnBjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBcUdBLHNDQVdDO0FBaEhELElBQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQztBQUNkLElBQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQztBQVFkOzs7OztHQUtHO0FBQ0g7SUFNRSx1QkFBcUIsUUFBMkM7UUFBM0MsYUFBUSxHQUFSLFFBQVEsQ0FBbUM7UUFKeEQsYUFBUSxHQUFXLENBQUMsQ0FBQztRQUNaLG1CQUFjLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLFlBQU8sR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO1FBRzNDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRCw4QkFBTSxHQUFOLFVBQU8sSUFBZ0I7UUFDckIsaURBQWlEO1FBQ2pELElBQUksSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO1lBQy9ELElBQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUNyRCxJQUFNLE9BQU8sR0FDVCxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztZQUN4RSxJQUFNLFNBQVMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMxQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7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SSxVQUFHLEdBQUcsZUFBSyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQU0sQ0FBQztRQUNqRCxDQUFDOzs7Ozs7Ozs7SUFDRCxhQUFhLElBQUksTUFBTSxDQUFDO0lBQ3hCLGFBQWEsSUFBSSxPQUFPLENBQUM7SUFDekIsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IENSID0gMTM7XG5jb25zdCBMRiA9IDEwO1xuXG4vKiogTWVzc2FnZXMgcmVjZWl2ZWQgdmlhIHRoZSByZWFkZXIuICovXG5leHBvcnQgaW50ZXJmYWNlIEpzb25ScGNNZXNzYWdlIHtcbiAgcmVhZG9ubHkgaGVhZGVyczoge1trZXk6IHN0cmluZ106IHN0cmluZ307XG4gIHJlYWRvbmx5IGNvbnRlbnQ6IHN0cmluZztcbn1cblxuLyoqXG4gKiBKU09OIFJQQyByZWFkZXIgZm9sbG93aW5nIHRoZSBEZWJ1ZyBBZGFwdGVyIFByb3RvY29sIG1lc3NhZ2VcbiAqIGZvcm1hdCB3aGljaCBpdHNlbGYgZm9sbG93cyBDaHJvbWUncyBWOCBkZWJ1Z2dlciBwcm90b2NvbCwgb3JpZ2luYWxseVxuICogZG9jdW1lbnRlZCBhdFxuICogaHR0cHM6Ly9naXRodWIuY29tL2J1Z2dlcmpzL2J1Z2dlci12OC1jbGllbnQvYmxvYi9tYXN0ZXIvUFJPVE9DT0wubWQjdjgtZGVidWdnZXItcHJvdG9jb2xcbiAqL1xuZXhwb3J0IGNsYXNzIEpzb25ScGNSZWFkZXIge1xuICBwcml2YXRlIGJ1ZmZlcjogVWludDhBcnJheTtcbiAgcHJpdmF0ZSBwb3NpdGlvbjogbnVtYmVyID0gMDtcbiAgcHJpdmF0ZSByZWFkb25seSBhbGxvY2F0aW9uU2l6ZSA9IDQwOTY7XG4gIHByaXZhdGUgcmVhZG9ubHkgZGVjb2RlciA9IG5ldyBUZXh0RGVjb2RlcigpO1xuXG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IGNhbGxiYWNrOiAobWVzc2FnZTogSnNvblJwY01lc3NhZ2UpID0+IHZvaWQpIHtcbiAgICB0aGlzLmJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KHRoaXMuYWxsb2NhdGlvblNpemUpO1xuICB9XG5cbiAgYXBwZW5kKGRhdGE6IFVpbnQ4QXJyYXkpOiBKc29uUnBjTWVzc2FnZVtdIHtcbiAgICAvLyBHcm93IHRoZSBidWZmZXIgaWYgbmVjZXNzYXJ5IHRvIGhvbGQgdGhlIGRhdGEuXG4gICAgaWYgKGRhdGEuYnl0ZUxlbmd0aCA+ICh0aGlzLmJ1ZmZlci5ieXRlTGVuZ3RoIC0gdGhpcy5wb3NpdGlvbikpIHtcbiAgICAgIGNvbnN0IHJlcXVpcmVkU2l6ZSA9IHRoaXMucG9zaXRpb24gKyBkYXRhLmJ5dGVMZW5ndGg7XG4gICAgICBjb25zdCBuZXdTaXplID1cbiAgICAgICAgICBNYXRoLmNlaWwocmVxdWlyZWRTaXplIC8gdGhpcy5hbGxvY2F0aW9uU2l6ZSkgKiB0aGlzLmFsbG9jYXRpb25TaXplO1xuICAgICAgY29uc3QgbmV3QnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkobmV3U2l6ZSk7XG4gICAgICBuZXdCdWZmZXIuc2V0KHRoaXMuYnVmZmVyLCAwKTtcbiAgICAgIHRoaXMuYnVmZmVyID0gbmV3QnVmZmVyO1xuICAgIH1cbiAgICAvLyBQdXNoIG5ldyBkYXRhIG9udG8gZW5kIG9mIHRoZSBidWZmZXIuXG4gICAgdGhpcy5idWZmZXIuc2V0KGRhdGEsIHRoaXMucG9zaXRpb24pO1xuICAgIHRoaXMucG9zaXRpb24gKz0gZGF0YS5ieXRlTGVuZ3RoO1xuXG4gICAgY29uc3QgcGFyc2VkTWVzc2FnZXMgPSBbXTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgLy8gUGFyc2UgYWxsIG1lc3NhZ2VzIG91dCBvZiB0aGUgYnVmZmVyLlxuICAgICAgY29uc3QgbWVzc2FnZSA9IHRoaXMudHJ5UmVhZE1lc3NhZ2UoKTtcbiAgICAgIGlmICghbWVzc2FnZSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHBhcnNlZE1lc3NhZ2VzLnB1c2gobWVzc2FnZSk7XG4gICAgICB0aGlzLmNhbGxiYWNrKG1lc3NhZ2UpO1xuICAgIH1cbiAgICByZXR1cm4gcGFyc2VkTWVzc2FnZXM7XG4gIH1cblxuICB0cnlSZWFkTWVzc2FnZSgpOiBKc29uUnBjTWVzc2FnZXxudWxsIHtcbiAgICAvLyBMb29wIHRocm91Z2ggbG9va2luZyBmb3IgXFxyXFxuXFxyXFxuIGluIHRoZSBidWZmZXIuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBvc2l0aW9uIC0gNDsgKytpKSB7XG4gICAgICAvLyBGaXJzdCBcXHJcXG4gaW5kaWNhdGVzIHRoZSBlbmQgb2YgdGhlIGhlYWRlcnMuXG4gICAgICBpZiAodGhpcy5idWZmZXJbaV0gPT09IENSICYmIHRoaXMuYnVmZmVyW2kgKyAxXSA9PT0gTEYgJiZcbiAgICAgICAgICB0aGlzLmJ1ZmZlcltpICsgMl0gPT09IENSICYmIHRoaXMuYnVmZmVyW2kgKyAzXSA9PT0gTEYpIHtcbiAgICAgICAgLy8gUGFyc2UgZWFjaCBvZiB0aGUgaGVhZGVyIGxpbmVzIG91dCBvZiB0aGUgaGVhZGVyIGJsb2NrLlxuICAgICAgICBjb25zdCBoZWFkZXJMZW5ndGggPSBpICsgNDtcbiAgICAgICAgY29uc3QgaGVhZGVyQnl0ZXMgPSB0aGlzLmJ1ZmZlci5zdWJhcnJheSgwLCBoZWFkZXJMZW5ndGgpO1xuICAgICAgICBjb25zdCBoZWFkZXJTdHJpbmcgPSB0aGlzLmRlY29kZXIuZGVjb2RlKGhlYWRlckJ5dGVzKTtcbiAgICAgICAgY29uc3QgaGVhZGVyTGluZXMgPSBoZWFkZXJTdHJpbmcuc3BsaXQoJ1xcclxcbicpO1xuICAgICAgICBjb25zdCBoZWFkZXJzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgaGVhZGVyTGluZXMpIHtcbiAgICAgICAgICBpZiAoIWxpbmUudHJpbSgpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgcGFpciA9IGxpbmUuc3BsaXQoJzonKTtcbiAgICAgICAgICBpZiAocGFpci5sZW5ndGggIT09IDIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSWxsZWdhbCBoZWFkZXIgdmFsdWU6ICR7bGluZX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaGVhZGVyc1twYWlyWzBdXSA9IHBhaXJbMV0udHJpbSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbnRlbnRMZW5ndGhTdHJpbmcgPSBoZWFkZXJzWydDb250ZW50LUxlbmd0aCddO1xuICAgICAgICBpZiAoIWNvbnRlbnRMZW5ndGhTdHJpbmcpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgQ29udGVudC1MZW5ndGggaGVhZGVyLicpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvbnRlbnRMZW5ndGggPSBOdW1iZXIoY29udGVudExlbmd0aFN0cmluZyk7XG4gICAgICAgIGlmIChpc05hTihjb250ZW50TGVuZ3RoKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgYEhlYWRlciBDb250ZW50LUxlbmd0aCBub3QgYSBudW1iZXI6ICR7Y29udGVudExlbmd0aFN0cmluZ30uYCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVxdWlyZWRMZW5ndGggPSBoZWFkZXJMZW5ndGggKyBjb250ZW50TGVuZ3RoO1xuICAgICAgICBpZiAocmVxdWlyZWRMZW5ndGggPD0gdGhpcy5wb3NpdGlvbikge1xuICAgICAgICAgIC8vIFRoaXMgaXMganVzdCBhIHZpZXcgb250byB0aGUgY3VycmVudCBidWZmZXIuXG4gICAgICAgICAgY29uc3QgY29udGVudEJ5dGVzID1cbiAgICAgICAgICAgICAgdGhpcy5idWZmZXIuc3ViYXJyYXkoaGVhZGVyTGVuZ3RoLCBoZWFkZXJMZW5ndGggKyBjb250ZW50TGVuZ3RoKTtcbiAgICAgICAgICBjb25zdCBjb250ZW50ID0gdGhpcy5kZWNvZGVyLmRlY29kZShjb250ZW50Qnl0ZXMpO1xuICAgICAgICAgIHRoaXMuYnVmZmVyLmNvcHlXaXRoaW4oXG4gICAgICAgICAgICAgIDAsIGhlYWRlckxlbmd0aCArIGNvbnRlbnRMZW5ndGgsIHRoaXMucG9zaXRpb24pO1xuICAgICAgICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uIC0gKGhlYWRlckxlbmd0aCArIGNvbnRlbnRMZW5ndGgpO1xuICAgICAgICAgIHJldHVybiB7aGVhZGVycywgY29udGVudH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqIEVuY29kZXMgdGhlIHN0cmluZyBjb250ZW50IHRvIGEgSlNPTiBSUEMgbWVzc2FnZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVKc29uUnBjKGNvbnRlbnQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGhlYWRlcnM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge1xuICAgICdDb250ZW50LUxlbmd0aCc6IFN0cmluZyhuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoY29udGVudCkuYnl0ZUxlbmd0aCksXG4gIH07XG4gIGxldCByZXF1ZXN0U3RyaW5nID0gJyc7XG4gIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGhlYWRlcnMpKSB7XG4gICAgcmVxdWVzdFN0cmluZyArPSBgJHtrZXl9OiAke2hlYWRlcnNba2V5XX1cXHJcXG5gO1xuICB9XG4gIHJlcXVlc3RTdHJpbmcgKz0gJ1xcclxcbic7XG4gIHJlcXVlc3RTdHJpbmcgKz0gY29udGVudDtcbiAgcmV0dXJuIHJlcXVlc3RTdHJpbmc7XG59XG4iXX0=