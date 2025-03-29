"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.all = void 0;
/**
 * Settings which may be used by the Python language server.
 * These are from the default preferences from a VSCode client, culled
 * to the LSP-related values.
 *
 * The difficulty here is that LSP only defines a mechanism to provide
 * generic settings and the server expects the client to send all necessary
 * settings. VSCode sends all Python settings to every Python language server.
 * Furthermore the language server may request specific settings later.
 *
 * See:
 * https://github.com/microsoft/pyright/blob/9d4e58d06643dccbfe0f450070334675b6b64724/docs/settings.md
 */
exports.all = {
    'python': {
        'analysis': {
            'diagnosticPublishDelay': 1000,
            'errors': [],
            'warnings': [],
            'information': [],
            'disabled': [],
            'typeshedPaths': [],
            'cacheFolderPath': '',
            'memory': { 'keepLibraryAst': false },
            'logLevel': 'Warning',
            'symbolsHierarchyDepthLimit': 10,
            'completeFunctionParens': false,
            'autoImportCompletions': true,
            'autoSearchPaths': true,
            'stubPath': 'typings',
            'diagnosticMode': 'openFilesOnly',
            'extraPaths': [],
            'useLibraryCodeForTypes': true,
            'typeCheckingMode': 'basic',
            // See diagnostics explanation at:
            // https://github.com/microsoft/pyright/blob/main/docs/configuration.md
            'diagnosticSeverityOverrides': {},
        },
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3Nfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL2dlbmZpbGVzL3RoaXJkX3BhcnR5L2NvbGFiL3NvdXJjZXMvbHNwL3NldHRpbmdzX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7Ozs7OztHQVlHO0FBQ1UsUUFBQSxHQUFHLEdBQTZCO0lBQzNDLFFBQVEsRUFBRTtRQUNSLFVBQVUsRUFBRTtZQUNWLHdCQUF3QixFQUFFLElBQUk7WUFDOUIsUUFBUSxFQUFFLEVBQUU7WUFDWixVQUFVLEVBQUUsRUFBRTtZQUNkLGFBQWEsRUFBRSxFQUFFO1lBQ2pCLFVBQVUsRUFBRSxFQUFFO1lBQ2QsZUFBZSxFQUFFLEVBQUU7WUFDbkIsaUJBQWlCLEVBQUUsRUFBRTtZQUNyQixRQUFRLEVBQUUsRUFBQyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUM7WUFDbkMsVUFBVSxFQUFFLFNBQVM7WUFDckIsNEJBQTRCLEVBQUUsRUFBRTtZQUNoQyx3QkFBd0IsRUFBRSxLQUFLO1lBQy9CLHVCQUF1QixFQUFFLElBQUk7WUFDN0IsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixVQUFVLEVBQUUsU0FBUztZQUNyQixnQkFBZ0IsRUFBRSxlQUFlO1lBQ2pDLFlBQVksRUFBRSxFQUFFO1lBQ2hCLHdCQUF3QixFQUFFLElBQUk7WUFDOUIsa0JBQWtCLEVBQUUsT0FBTztZQUMzQixrQ0FBa0M7WUFDbEMsdUVBQXVFO1lBQ3ZFLDZCQUE2QixFQUFFLEVBQUU7U0FDbEM7S0FDRjtDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFNldHRpbmdzIHdoaWNoIG1heSBiZSB1c2VkIGJ5IHRoZSBQeXRob24gbGFuZ3VhZ2Ugc2VydmVyLlxuICogVGhlc2UgYXJlIGZyb20gdGhlIGRlZmF1bHQgcHJlZmVyZW5jZXMgZnJvbSBhIFZTQ29kZSBjbGllbnQsIGN1bGxlZFxuICogdG8gdGhlIExTUC1yZWxhdGVkIHZhbHVlcy5cbiAqXG4gKiBUaGUgZGlmZmljdWx0eSBoZXJlIGlzIHRoYXQgTFNQIG9ubHkgZGVmaW5lcyBhIG1lY2hhbmlzbSB0byBwcm92aWRlXG4gKiBnZW5lcmljIHNldHRpbmdzIGFuZCB0aGUgc2VydmVyIGV4cGVjdHMgdGhlIGNsaWVudCB0byBzZW5kIGFsbCBuZWNlc3NhcnlcbiAqIHNldHRpbmdzLiBWU0NvZGUgc2VuZHMgYWxsIFB5dGhvbiBzZXR0aW5ncyB0byBldmVyeSBQeXRob24gbGFuZ3VhZ2Ugc2VydmVyLlxuICogRnVydGhlcm1vcmUgdGhlIGxhbmd1YWdlIHNlcnZlciBtYXkgcmVxdWVzdCBzcGVjaWZpYyBzZXR0aW5ncyBsYXRlci5cbiAqXG4gKiBTZWU6XG4gKiBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L3B5cmlnaHQvYmxvYi85ZDRlNThkMDY2NDNkY2NiZmUwZjQ1MDA3MDMzNDY3NWI2YjY0NzI0L2RvY3Mvc2V0dGluZ3MubWRcbiAqL1xuZXhwb3J0IGNvbnN0IGFsbDoge1trZXk6IHN0cmluZ106IHVua25vd259ID0ge1xuICAncHl0aG9uJzoge1xuICAgICdhbmFseXNpcyc6IHtcbiAgICAgICdkaWFnbm9zdGljUHVibGlzaERlbGF5JzogMTAwMCxcbiAgICAgICdlcnJvcnMnOiBbXSxcbiAgICAgICd3YXJuaW5ncyc6IFtdLFxuICAgICAgJ2luZm9ybWF0aW9uJzogW10sXG4gICAgICAnZGlzYWJsZWQnOiBbXSxcbiAgICAgICd0eXBlc2hlZFBhdGhzJzogW10sXG4gICAgICAnY2FjaGVGb2xkZXJQYXRoJzogJycsXG4gICAgICAnbWVtb3J5JzogeydrZWVwTGlicmFyeUFzdCc6IGZhbHNlfSxcbiAgICAgICdsb2dMZXZlbCc6ICdXYXJuaW5nJyxcbiAgICAgICdzeW1ib2xzSGllcmFyY2h5RGVwdGhMaW1pdCc6IDEwLFxuICAgICAgJ2NvbXBsZXRlRnVuY3Rpb25QYXJlbnMnOiBmYWxzZSxcbiAgICAgICdhdXRvSW1wb3J0Q29tcGxldGlvbnMnOiB0cnVlLFxuICAgICAgJ2F1dG9TZWFyY2hQYXRocyc6IHRydWUsXG4gICAgICAnc3R1YlBhdGgnOiAndHlwaW5ncycsXG4gICAgICAnZGlhZ25vc3RpY01vZGUnOiAnb3BlbkZpbGVzT25seScsXG4gICAgICAnZXh0cmFQYXRocyc6IFtdLFxuICAgICAgJ3VzZUxpYnJhcnlDb2RlRm9yVHlwZXMnOiB0cnVlLFxuICAgICAgJ3R5cGVDaGVja2luZ01vZGUnOiAnYmFzaWMnLFxuICAgICAgLy8gU2VlIGRpYWdub3N0aWNzIGV4cGxhbmF0aW9uIGF0OlxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21pY3Jvc29mdC9weXJpZ2h0L2Jsb2IvbWFpbi9kb2NzL2NvbmZpZ3VyYXRpb24ubWRcbiAgICAgICdkaWFnbm9zdGljU2V2ZXJpdHlPdmVycmlkZXMnOiB7fSxcbiAgICB9LFxuICB9LFxufTtcbiJdfQ==