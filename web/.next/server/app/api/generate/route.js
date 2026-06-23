/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/generate/route";
exports.ids = ["app/api/generate/route"];
exports.modules = {

/***/ "(rsc)/./app/api/generate/route.ts":
/*!***********************************!*\
  !*** ./app/api/generate/route.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var openai__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! openai */ \"(rsc)/./node_modules/openai/index.mjs\");\n\n\nconst client = new openai__WEBPACK_IMPORTED_MODULE_1__[\"default\"]({\n    baseURL: process.env.AI_BASE_URL,\n    apiKey: process.env.AI_API_KEY\n});\nconst SYSTEM_PROMPT = `Kamu adalah AI yang membuat script video pendek (short-form) untuk konten developer di TikTok/YouTube Shorts/Instagram Reels.\n\nFormat video: intro + 5 tips + outro (total 7 scene).\n\nKamu HARUS mengembalikan JSON valid dengan struktur ini (tanpa markdown, hanya JSON):\n{\n  \"videoTitle\": \"string (maks 40 karakter, catchy, pakai angka)\",\n  \"subtitle\": \"string (maks 60 karakter, hook yang bikin penasaran)\",\n  \"introEmoji\": \"string (1 emoji yang relevan)\",\n  \"accent\": \"string (hex color yang cocok dengan tema, pilih dari: #6366f1 #3b82f6 #22c55e #f97316 #ec4899 #007ACC #eab308)\",\n  \"tips\": [\n    {\n      \"title\": \"string (maks 30 karakter, nama tip singkat)\",\n      \"subtitle\": \"string (maks 70 karakter, penjelasan singkat manfaatnya)\",\n      \"emoji\": \"string (1 emoji)\"\n    }\n  ],\n  \"ctaText\": \"string (maks 50 karakter, ajakan action di akhir)\",\n  \"scenes\": [\n    { \"id\": \"intro\", \"text\": \"string (narasi voiceover intro, 2-3 kalimat, bahasa Indonesia casual)\" },\n    { \"id\": \"tip-1\", \"text\": \"string (narasi voiceover tip 1, 2-3 kalimat)\" },\n    { \"id\": \"tip-2\", \"text\": \"string\" },\n    { \"id\": \"tip-3\", \"text\": \"string\" },\n    { \"id\": \"tip-4\", \"text\": \"string\" },\n    { \"id\": \"tip-5\", \"text\": \"string\" },\n    { \"id\": \"outro\", \"text\": \"string (narasi outro + CTA, 2 kalimat)\" }\n  ]\n}\n\nAturan narasi voiceover:\n- Bahasa Indonesia casual/gaul tapi tetap jelas\n- Energik, to-the-point, tidak bertele-tele\n- Hindari simbol seperti # @ & — tulis sebagai kata\n- Angka tulis sebagai kata: \"lima\" bukan \"5\"\n- Akronim teknis (API, HTML, CSS, JS) boleh dipakai as-is\n\nAturan tips array: harus tepat 5 item.`;\nasync function POST(req) {\n    const { topic, accent } = await req.json();\n    if (!topic) return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        error: \"topic required\"\n    }, {\n        status: 400\n    });\n    const completion = await client.chat.completions.create({\n        model: process.env.AI_MODEL ?? \"creavoo-combo\",\n        messages: [\n            {\n                role: \"system\",\n                content: SYSTEM_PROMPT\n            },\n            {\n                role: \"user\",\n                content: `Buat script video pendek tentang: \"${topic}\". ${accent ? `Gunakan warna accent: ${accent}` : \"\"}`\n            }\n        ],\n        temperature: 0.8,\n        max_tokens: 2000\n    });\n    const raw = completion.choices[0].message.content ?? \"\";\n    // Strip markdown code blocks if AI wraps in ```json\n    const jsonStr = raw.replace(/^```(?:json)?\\n?/m, \"\").replace(/\\n?```$/m, \"\").trim();\n    let data;\n    try {\n        data = JSON.parse(jsonStr);\n    } catch  {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"AI returned invalid JSON\",\n            raw\n        }, {\n            status: 500\n        });\n    }\n    // Override accent if user picked one\n    if (accent) data.accent = accent;\n    return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(data);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2dlbmVyYXRlL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUF3RDtBQUM1QjtBQUU1QixNQUFNRSxTQUFTLElBQUlELDhDQUFNQSxDQUFDO0lBQ3hCRSxTQUFTQyxRQUFRQyxHQUFHLENBQUNDLFdBQVc7SUFDaENDLFFBQVFILFFBQVFDLEdBQUcsQ0FBQ0csVUFBVTtBQUNoQztBQUVBLE1BQU1DLGdCQUFnQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7c0NBb0NlLENBQUM7QUFFaEMsZUFBZUMsS0FBS0MsR0FBZ0I7SUFDekMsTUFBTSxFQUFFQyxLQUFLLEVBQUVDLE1BQU0sRUFBRSxHQUFHLE1BQU1GLElBQUlHLElBQUk7SUFFeEMsSUFBSSxDQUFDRixPQUFPLE9BQU9aLHFEQUFZQSxDQUFDYyxJQUFJLENBQUM7UUFBRUMsT0FBTztJQUFpQixHQUFHO1FBQUVDLFFBQVE7SUFBSTtJQUVoRixNQUFNQyxhQUFhLE1BQU1mLE9BQU9nQixJQUFJLENBQUNDLFdBQVcsQ0FBQ0MsTUFBTSxDQUFDO1FBQ3REQyxPQUFPakIsUUFBUUMsR0FBRyxDQUFDaUIsUUFBUSxJQUFJO1FBQy9CQyxVQUFVO1lBQ1I7Z0JBQUVDLE1BQU07Z0JBQVVDLFNBQVNoQjtZQUFjO1lBQ3pDO2dCQUNFZSxNQUFNO2dCQUNOQyxTQUFTLENBQUMsbUNBQW1DLEVBQUViLE1BQU0sR0FBRyxFQUFFQyxTQUFTLENBQUMsc0JBQXNCLEVBQUVBLFFBQVEsR0FBRyxJQUFJO1lBQzdHO1NBQ0Q7UUFDRGEsYUFBYTtRQUNiQyxZQUFZO0lBQ2Q7SUFFQSxNQUFNQyxNQUFNWCxXQUFXWSxPQUFPLENBQUMsRUFBRSxDQUFDQyxPQUFPLENBQUNMLE9BQU8sSUFBSTtJQUVyRCxvREFBb0Q7SUFDcEQsTUFBTU0sVUFBVUgsSUFBSUksT0FBTyxDQUFDLHFCQUFxQixJQUFJQSxPQUFPLENBQUMsWUFBWSxJQUFJQyxJQUFJO0lBRWpGLElBQUlDO0lBQ0osSUFBSTtRQUNGQSxPQUFPQyxLQUFLQyxLQUFLLENBQUNMO0lBQ3BCLEVBQUUsT0FBTTtRQUNOLE9BQU8vQixxREFBWUEsQ0FBQ2MsSUFBSSxDQUFDO1lBQUVDLE9BQU87WUFBNEJhO1FBQUksR0FBRztZQUFFWixRQUFRO1FBQUk7SUFDckY7SUFFQSxxQ0FBcUM7SUFDckMsSUFBSUgsUUFBUXFCLEtBQUtyQixNQUFNLEdBQUdBO0lBRTFCLE9BQU9iLHFEQUFZQSxDQUFDYyxJQUFJLENBQUNvQjtBQUMzQiIsInNvdXJjZXMiOlsiQzpcXFVzZXJzXFxLQk4gRGlnaXRhbFxcRG93bmxvYWRzXFxDb21wcmVzc2VkXFxkZXYtc2hvcnRzLWZhY3RvcnktZnJlZVxccmVtb3Rpb24tc2hvcnRzLXRlbXBsYXRlXFx3ZWJcXGFwcFxcYXBpXFxnZW5lcmF0ZVxccm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlcXVlc3QsIE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xuaW1wb3J0IE9wZW5BSSBmcm9tIFwib3BlbmFpXCI7XG5cbmNvbnN0IGNsaWVudCA9IG5ldyBPcGVuQUkoe1xuICBiYXNlVVJMOiBwcm9jZXNzLmVudi5BSV9CQVNFX1VSTCxcbiAgYXBpS2V5OiBwcm9jZXNzLmVudi5BSV9BUElfS0VZLFxufSk7XG5cbmNvbnN0IFNZU1RFTV9QUk9NUFQgPSBgS2FtdSBhZGFsYWggQUkgeWFuZyBtZW1idWF0IHNjcmlwdCB2aWRlbyBwZW5kZWsgKHNob3J0LWZvcm0pIHVudHVrIGtvbnRlbiBkZXZlbG9wZXIgZGkgVGlrVG9rL1lvdVR1YmUgU2hvcnRzL0luc3RhZ3JhbSBSZWVscy5cblxuRm9ybWF0IHZpZGVvOiBpbnRybyArIDUgdGlwcyArIG91dHJvICh0b3RhbCA3IHNjZW5lKS5cblxuS2FtdSBIQVJVUyBtZW5nZW1iYWxpa2FuIEpTT04gdmFsaWQgZGVuZ2FuIHN0cnVrdHVyIGluaSAodGFucGEgbWFya2Rvd24sIGhhbnlhIEpTT04pOlxue1xuICBcInZpZGVvVGl0bGVcIjogXCJzdHJpbmcgKG1ha3MgNDAga2FyYWt0ZXIsIGNhdGNoeSwgcGFrYWkgYW5na2EpXCIsXG4gIFwic3VidGl0bGVcIjogXCJzdHJpbmcgKG1ha3MgNjAga2FyYWt0ZXIsIGhvb2sgeWFuZyBiaWtpbiBwZW5hc2FyYW4pXCIsXG4gIFwiaW50cm9FbW9qaVwiOiBcInN0cmluZyAoMSBlbW9qaSB5YW5nIHJlbGV2YW4pXCIsXG4gIFwiYWNjZW50XCI6IFwic3RyaW5nIChoZXggY29sb3IgeWFuZyBjb2NvayBkZW5nYW4gdGVtYSwgcGlsaWggZGFyaTogIzYzNjZmMSAjM2I4MmY2ICMyMmM1NWUgI2Y5NzMxNiAjZWM0ODk5ICMwMDdBQ0MgI2VhYjMwOClcIixcbiAgXCJ0aXBzXCI6IFtcbiAgICB7XG4gICAgICBcInRpdGxlXCI6IFwic3RyaW5nIChtYWtzIDMwIGthcmFrdGVyLCBuYW1hIHRpcCBzaW5na2F0KVwiLFxuICAgICAgXCJzdWJ0aXRsZVwiOiBcInN0cmluZyAobWFrcyA3MCBrYXJha3RlciwgcGVuamVsYXNhbiBzaW5na2F0IG1hbmZhYXRueWEpXCIsXG4gICAgICBcImVtb2ppXCI6IFwic3RyaW5nICgxIGVtb2ppKVwiXG4gICAgfVxuICBdLFxuICBcImN0YVRleHRcIjogXCJzdHJpbmcgKG1ha3MgNTAga2FyYWt0ZXIsIGFqYWthbiBhY3Rpb24gZGkgYWtoaXIpXCIsXG4gIFwic2NlbmVzXCI6IFtcbiAgICB7IFwiaWRcIjogXCJpbnRyb1wiLCBcInRleHRcIjogXCJzdHJpbmcgKG5hcmFzaSB2b2ljZW92ZXIgaW50cm8sIDItMyBrYWxpbWF0LCBiYWhhc2EgSW5kb25lc2lhIGNhc3VhbClcIiB9LFxuICAgIHsgXCJpZFwiOiBcInRpcC0xXCIsIFwidGV4dFwiOiBcInN0cmluZyAobmFyYXNpIHZvaWNlb3ZlciB0aXAgMSwgMi0zIGthbGltYXQpXCIgfSxcbiAgICB7IFwiaWRcIjogXCJ0aXAtMlwiLCBcInRleHRcIjogXCJzdHJpbmdcIiB9LFxuICAgIHsgXCJpZFwiOiBcInRpcC0zXCIsIFwidGV4dFwiOiBcInN0cmluZ1wiIH0sXG4gICAgeyBcImlkXCI6IFwidGlwLTRcIiwgXCJ0ZXh0XCI6IFwic3RyaW5nXCIgfSxcbiAgICB7IFwiaWRcIjogXCJ0aXAtNVwiLCBcInRleHRcIjogXCJzdHJpbmdcIiB9LFxuICAgIHsgXCJpZFwiOiBcIm91dHJvXCIsIFwidGV4dFwiOiBcInN0cmluZyAobmFyYXNpIG91dHJvICsgQ1RBLCAyIGthbGltYXQpXCIgfVxuICBdXG59XG5cbkF0dXJhbiBuYXJhc2kgdm9pY2VvdmVyOlxuLSBCYWhhc2EgSW5kb25lc2lhIGNhc3VhbC9nYXVsIHRhcGkgdGV0YXAgamVsYXNcbi0gRW5lcmdpaywgdG8tdGhlLXBvaW50LCB0aWRhayBiZXJ0ZWxlLXRlbGVcbi0gSGluZGFyaSBzaW1ib2wgc2VwZXJ0aSAjIEAgJiDigJQgdHVsaXMgc2ViYWdhaSBrYXRhXG4tIEFuZ2thIHR1bGlzIHNlYmFnYWkga2F0YTogXCJsaW1hXCIgYnVrYW4gXCI1XCJcbi0gQWtyb25pbSB0ZWtuaXMgKEFQSSwgSFRNTCwgQ1NTLCBKUykgYm9sZWggZGlwYWthaSBhcy1pc1xuXG5BdHVyYW4gdGlwcyBhcnJheTogaGFydXMgdGVwYXQgNSBpdGVtLmA7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBQT1NUKHJlcTogTmV4dFJlcXVlc3QpIHtcbiAgY29uc3QgeyB0b3BpYywgYWNjZW50IH0gPSBhd2FpdCByZXEuanNvbigpO1xuXG4gIGlmICghdG9waWMpIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcInRvcGljIHJlcXVpcmVkXCIgfSwgeyBzdGF0dXM6IDQwMCB9KTtcblxuICBjb25zdCBjb21wbGV0aW9uID0gYXdhaXQgY2xpZW50LmNoYXQuY29tcGxldGlvbnMuY3JlYXRlKHtcbiAgICBtb2RlbDogcHJvY2Vzcy5lbnYuQUlfTU9ERUwgPz8gXCJjcmVhdm9vLWNvbWJvXCIsXG4gICAgbWVzc2FnZXM6IFtcbiAgICAgIHsgcm9sZTogXCJzeXN0ZW1cIiwgY29udGVudDogU1lTVEVNX1BST01QVCB9LFxuICAgICAge1xuICAgICAgICByb2xlOiBcInVzZXJcIixcbiAgICAgICAgY29udGVudDogYEJ1YXQgc2NyaXB0IHZpZGVvIHBlbmRlayB0ZW50YW5nOiBcIiR7dG9waWN9XCIuICR7YWNjZW50ID8gYEd1bmFrYW4gd2FybmEgYWNjZW50OiAke2FjY2VudH1gIDogXCJcIn1gLFxuICAgICAgfSxcbiAgICBdLFxuICAgIHRlbXBlcmF0dXJlOiAwLjgsXG4gICAgbWF4X3Rva2VuczogMjAwMCxcbiAgfSk7XG5cbiAgY29uc3QgcmF3ID0gY29tcGxldGlvbi5jaG9pY2VzWzBdLm1lc3NhZ2UuY29udGVudCA/PyBcIlwiO1xuXG4gIC8vIFN0cmlwIG1hcmtkb3duIGNvZGUgYmxvY2tzIGlmIEFJIHdyYXBzIGluIGBgYGpzb25cbiAgY29uc3QganNvblN0ciA9IHJhdy5yZXBsYWNlKC9eYGBgKD86anNvbik/XFxuPy9tLCBcIlwiKS5yZXBsYWNlKC9cXG4/YGBgJC9tLCBcIlwiKS50cmltKCk7XG5cbiAgbGV0IGRhdGE7XG4gIHRyeSB7XG4gICAgZGF0YSA9IEpTT04ucGFyc2UoanNvblN0cik7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcIkFJIHJldHVybmVkIGludmFsaWQgSlNPTlwiLCByYXcgfSwgeyBzdGF0dXM6IDUwMCB9KTtcbiAgfVxuXG4gIC8vIE92ZXJyaWRlIGFjY2VudCBpZiB1c2VyIHBpY2tlZCBvbmVcbiAgaWYgKGFjY2VudCkgZGF0YS5hY2NlbnQgPSBhY2NlbnQ7XG5cbiAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKGRhdGEpO1xufVxuIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsIk9wZW5BSSIsImNsaWVudCIsImJhc2VVUkwiLCJwcm9jZXNzIiwiZW52IiwiQUlfQkFTRV9VUkwiLCJhcGlLZXkiLCJBSV9BUElfS0VZIiwiU1lTVEVNX1BST01QVCIsIlBPU1QiLCJyZXEiLCJ0b3BpYyIsImFjY2VudCIsImpzb24iLCJlcnJvciIsInN0YXR1cyIsImNvbXBsZXRpb24iLCJjaGF0IiwiY29tcGxldGlvbnMiLCJjcmVhdGUiLCJtb2RlbCIsIkFJX01PREVMIiwibWVzc2FnZXMiLCJyb2xlIiwiY29udGVudCIsInRlbXBlcmF0dXJlIiwibWF4X3Rva2VucyIsInJhdyIsImNob2ljZXMiLCJtZXNzYWdlIiwianNvblN0ciIsInJlcGxhY2UiLCJ0cmltIiwiZGF0YSIsIkpTT04iLCJwYXJzZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/generate/route.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgenerate%2Froute&page=%2Fapi%2Fgenerate%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgenerate%2Froute.ts&appDir=C%3A%5CUsers%5CKBN%20Digital%5CDownloads%5CCompressed%5Cdev-shorts-factory-free%5Cremotion-shorts-template%5Cweb%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CKBN%20Digital%5CDownloads%5CCompressed%5Cdev-shorts-factory-free%5Cremotion-shorts-template%5Cweb&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgenerate%2Froute&page=%2Fapi%2Fgenerate%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgenerate%2Froute.ts&appDir=C%3A%5CUsers%5CKBN%20Digital%5CDownloads%5CCompressed%5Cdev-shorts-factory-free%5Cremotion-shorts-template%5Cweb%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CKBN%20Digital%5CDownloads%5CCompressed%5Cdev-shorts-factory-free%5Cremotion-shorts-template%5Cweb&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_KBN_Digital_Downloads_Compressed_dev_shorts_factory_free_remotion_shorts_template_web_app_api_generate_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/generate/route.ts */ \"(rsc)/./app/api/generate/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/generate/route\",\n        pathname: \"/api/generate\",\n        filename: \"route\",\n        bundlePath: \"app/api/generate/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\KBN Digital\\\\Downloads\\\\Compressed\\\\dev-shorts-factory-free\\\\remotion-shorts-template\\\\web\\\\app\\\\api\\\\generate\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_KBN_Digital_Downloads_Compressed_dev_shorts_factory_free_remotion_shorts_template_web_app_api_generate_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZnZW5lcmF0ZSUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGZ2VuZXJhdGUlMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZnZW5lcmF0ZSUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNLQk4lMjBEaWdpdGFsJTVDRG93bmxvYWRzJTVDQ29tcHJlc3NlZCU1Q2Rldi1zaG9ydHMtZmFjdG9yeS1mcmVlJTVDcmVtb3Rpb24tc2hvcnRzLXRlbXBsYXRlJTVDd2ViJTVDYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj1DJTNBJTVDVXNlcnMlNUNLQk4lMjBEaWdpdGFsJTVDRG93bmxvYWRzJTVDQ29tcHJlc3NlZCU1Q2Rldi1zaG9ydHMtZmFjdG9yeS1mcmVlJTVDcmVtb3Rpb24tc2hvcnRzLXRlbXBsYXRlJTVDd2ViJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNxQjtBQUNtRjtBQUNoSztBQUNBO0FBQ0E7QUFDQSx3QkFBd0IseUdBQW1CO0FBQzNDO0FBQ0EsY0FBYyxrRUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLHNEQUFzRDtBQUM5RDtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUMwRjs7QUFFMUYiLCJzb3VyY2VzIjpbIiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiQzpcXFxcVXNlcnNcXFxcS0JOIERpZ2l0YWxcXFxcRG93bmxvYWRzXFxcXENvbXByZXNzZWRcXFxcZGV2LXNob3J0cy1mYWN0b3J5LWZyZWVcXFxccmVtb3Rpb24tc2hvcnRzLXRlbXBsYXRlXFxcXHdlYlxcXFxhcHBcXFxcYXBpXFxcXGdlbmVyYXRlXFxcXHJvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9nZW5lcmF0ZS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2dlbmVyYXRlXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9nZW5lcmF0ZS9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIkM6XFxcXFVzZXJzXFxcXEtCTiBEaWdpdGFsXFxcXERvd25sb2Fkc1xcXFxDb21wcmVzc2VkXFxcXGRldi1zaG9ydHMtZmFjdG9yeS1mcmVlXFxcXHJlbW90aW9uLXNob3J0cy10ZW1wbGF0ZVxcXFx3ZWJcXFxcYXBwXFxcXGFwaVxcXFxnZW5lcmF0ZVxcXFxyb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHdvcmtBc3luY1N0b3JhZ2UsXG4gICAgICAgIHdvcmtVbml0QXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgenerate%2Froute&page=%2Fapi%2Fgenerate%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgenerate%2Froute.ts&appDir=C%3A%5CUsers%5CKBN%20Digital%5CDownloads%5CCompressed%5Cdev-shorts-factory-free%5Cremotion-shorts-template%5Cweb%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CKBN%20Digital%5CDownloads%5CCompressed%5Cdev-shorts-factory-free%5Cremotion-shorts-template%5Cweb&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "node:fs":
/*!**************************!*\
  !*** external "node:fs" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:fs");

/***/ }),

/***/ "node:stream":
/*!******************************!*\
  !*** external "node:stream" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:stream");

/***/ }),

/***/ "node:stream/web":
/*!**********************************!*\
  !*** external "node:stream/web" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:stream/web");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("punycode");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ "worker_threads":
/*!*********************************!*\
  !*** external "worker_threads" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("worker_threads");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/formdata-node","vendor-chunks/openai","vendor-chunks/form-data-encoder","vendor-chunks/whatwg-url","vendor-chunks/agentkeepalive","vendor-chunks/tr46","vendor-chunks/web-streams-polyfill","vendor-chunks/node-fetch","vendor-chunks/webidl-conversions","vendor-chunks/ms","vendor-chunks/humanize-ms","vendor-chunks/event-target-shim","vendor-chunks/abort-controller"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fgenerate%2Froute&page=%2Fapi%2Fgenerate%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fgenerate%2Froute.ts&appDir=C%3A%5CUsers%5CKBN%20Digital%5CDownloads%5CCompressed%5Cdev-shorts-factory-free%5Cremotion-shorts-template%5Cweb%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CKBN%20Digital%5CDownloads%5CCompressed%5Cdev-shorts-factory-free%5Cremotion-shorts-template%5Cweb&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();