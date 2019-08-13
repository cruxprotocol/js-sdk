"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _this = this;
exports.__esModule = true;
var eventemitter3_1 = require("eventemitter3");
var peerjs_1 = __importDefault(require("peerjs"));
var noop = function () { };
var Storage = /** @class */ (function () {
    function Storage() {
    }
    Storage.storage = sessionStorage || localStorage;
    Storage.setItem = function (key, value) {
        Storage.storage.setItem(key, value);
    };
    Storage.getItem = function (key) {
        return Storage.storage.getItem(key);
    };
    Storage.setJSON = function (key, jsonObj) {
        var objString = JSON.stringify(jsonObj);
        Storage.storage.setItem(key, objString);
    };
    Storage.getJSON = function (key) {
        var objString = Storage.storage.getItem(key);
        return JSON.parse(objString);
    };
    return Storage;
}());
exports.Storage = Storage;
var Encryption = /** @class */ (function () {
    function Encryption() {
    }
    Encryption.digest = function (str) { return __awaiter(_this, void 0, void 0, function () {
        var buffer;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, crypto.subtle.digest("SHA-256", new TextEncoder().encode(str))];
                case 1:
                    buffer = _a.sent();
                    return [2 /*return*/, Array.prototype.map.call(new Uint8Array(buffer), function (x) { return (('00' + x.toString(16)).slice(-2)); }).join('')];
            }
        });
    }); };
    Encryption.encryptJSON = function (jsonObj, password) { return __awaiter(_this, void 0, void 0, function () {
        var plainText;
        return __generator(this, function (_a) {
            plainText = JSON.stringify(jsonObj);
            return [2 /*return*/, Encryption.encryptText(plainText, password)];
        });
    }); };
    Encryption.decryptJSON = function (ctBuffer, iv, password) { return __awaiter(_this, void 0, void 0, function () {
        var JSONString;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, Encryption.decryptText(ctBuffer, iv, password)];
                case 1:
                    JSONString = _a.sent();
                    return [2 /*return*/, JSON.parse(JSONString)];
            }
        });
    }); };
    Encryption.encryptText = function (plainText, password) { return __awaiter(_this, void 0, void 0, function () {
        var ptUtf8, pwUtf8, pwHash, iv, alg, key, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    ptUtf8 = new TextEncoder().encode(plainText);
                    pwUtf8 = new TextEncoder().encode(password);
                    return [4 /*yield*/, crypto.subtle.digest('SHA-256', pwUtf8)];
                case 1:
                    pwHash = _b.sent();
                    iv = crypto.getRandomValues(new Uint8Array(12));
                    alg = { name: 'AES-GCM', iv: iv };
                    return [4 /*yield*/, crypto.subtle.importKey('raw', pwHash, alg, false, ['encrypt'])];
                case 2:
                    key = _b.sent();
                    _a = { iv: iv };
                    return [4 /*yield*/, crypto.subtle.encrypt(alg, key, ptUtf8)];
                case 3: return [2 /*return*/, (_a.encBuffer = _b.sent(), _a)];
            }
        });
    }); };
    Encryption.decryptText = function (ctBuffer, iv, password) { return __awaiter(_this, void 0, void 0, function () {
        var pwUtf8, pwHash, alg, key, ptBuffer, plaintext;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pwUtf8 = new TextEncoder().encode(password);
                    return [4 /*yield*/, crypto.subtle.digest('SHA-256', pwUtf8)];
                case 1:
                    pwHash = _a.sent();
                    alg = { name: 'AES-GCM', iv: iv };
                    return [4 /*yield*/, crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt'])];
                case 2:
                    key = _a.sent();
                    return [4 /*yield*/, crypto.subtle.decrypt(alg, key, ctBuffer)];
                case 3:
                    ptBuffer = _a.sent();
                    plaintext = new TextDecoder().decode(ptBuffer);
                    return [2 /*return*/, plaintext];
            }
        });
    }); };
    return Encryption;
}());
exports.Encryption = Encryption;
var iceConfig = {
    iceServers: [
        { url: 'stun:stun01.sipphone.com' },
        { url: 'stun:stun.ekiga.net' },
        { url: 'stun:stun.fwdnet.net' },
        { url: 'stun:stun.ideasip.com' },
        { url: 'stun:stun.iptel.org' },
        { url: 'stun:stun.rixtelecom.se' },
        { url: 'stun:stun.schlund.de' },
        { url: 'stun:stun.l.google.com:19302' },
        { url: 'stun:stun1.l.google.com:19302' },
        { url: 'stun:stun2.l.google.com:19302' },
        { url: 'stun:stun3.l.google.com:19302' },
        { url: 'stun:stun4.l.google.com:19302' },
        { url: 'stun:stunserver.org' },
        { url: 'stun:stun.softjoys.com' },
        { url: 'stun:stun.voiparound.com' },
        { url: 'stun:stun.voipbuster.com' },
        { url: 'stun:stun.voipstunt.com' },
        { url: 'stun:stun.voxgratia.org' },
        { url: 'stun:stun.xten.com' },
        {
            url: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com'
        },
        {
            url: 'turn:192.158.29.39:3478?transport=udp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
        },
        {
            url: 'turn:192.158.29.39:3478?transport=tcp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808'
        }
    ]
};
var OpenPayPeer = /** @class */ (function (_super) {
    __extends(OpenPayPeer, _super);
    /**
     *
     */
    function OpenPayPeer() {
        var _this = _super.call(this) || this;
        _this._peerServerCred = { key: "peerjs", secure: true, host: "157.230.199.143", port: 9090, config: iceConfig };
        _this.hasPayIDClaim = function () {
            return Boolean(_this._payIDClaim);
        };
        _this.getPayIDClaim = function () {
            return _this._payIDClaim;
        };
        _this.addPayIDClaim = function (virtualAddress, passcode) {
            var payIDClaim = {
                virtualAddress: virtualAddress,
                passcode: passcode
            };
            Storage.setJSON('payIDClaim', payIDClaim);
            _this._setPayIDClaim(payIDClaim);
        };
        _this._hasPayIDClaimStored = function () {
            return Boolean(Storage.getJSON('payIDClaim'));
        };
        _this._setPayIDClaim = function (payIDClaim) {
            _this._payIDClaim = payIDClaim;
        };
        _this._registerDataCallbacks = function (dataConnection) {
            dataConnection.on('open', function () {
                console.log("New peer connection " + dataConnection.peer);
                dataConnection.send("ping");
            });
            dataConnection.on('data', function (data) { return __awaiter(_this, void 0, void 0, function () {
                var decryptedJSON, err_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(data == "ping" || data == "pong")) return [3 /*break*/, 1];
                            console.log(dataConnection.peer + ": " + data);
                            if (data == "ping")
                                dataConnection.send("pong");
                            return [3 /*break*/, 6];
                        case 1:
                            decryptedJSON = void 0;
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, Encryption.decryptJSON(data.encBuffer, data.iv, this._payIDClaim.passcode)];
                        case 3:
                            decryptedJSON = _a.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            err_1 = _a.sent();
                            console.log("Data from " + dataConnection.peer + " could not be decrypted");
                            return [2 /*return*/];
                        case 5:
                            // Parse openpay_v1 
                            if (decryptedJSON.format == "openpay_v1") {
                                console.log(dataConnection.peer + ":", decryptedJSON);
                                this.emit('request', decryptedJSON);
                                // document.getElementById('data').innerHTML += `From ${dataConnection.peer}: ${JSON.stringify(decryptedJSON, undefined, 4)}\n`
                            }
                            else {
                                throw "Unknown msg format " + dataConnection.peer + ": " + data;
                            }
                            _a.label = 6;
                        case 6: return [2 /*return*/];
                    }
                });
            }); });
        };
        _this.isActive = function () {
            if (!_this._peer)
                return false;
            return Boolean(_this._peer['open']);
        };
        _this.isListening = function () {
            if (!_this._peer)
                return false;
            var liveConnections = Object.keys(_this._peer.connections)
                .map(function (peer) { return _this._peer.connections[peer].map(function (conn) { return conn.open; }).filter(function (val) { return Boolean(val); }); })
                .filter(function (peer) { return peer.length > 0; });
            return liveConnections.length > 0 ? true : false;
        };
        if (_this._hasPayIDClaimStored) {
            var payIDClaim = Storage.getJSON('payIDClaim');
            _this._setPayIDClaim(payIDClaim);
        }
        return _this;
    }
    OpenPayPeer.prototype._initialisePeer = function () {
        return __awaiter(this, void 0, void 0, function () {
            var promise;
            var _this = this;
            return __generator(this, function (_a) {
                promise = new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                    var peerId, peer;
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this._generatePeerId(this._payIDClaim.virtualAddress, this._payIDClaim.passcode)];
                            case 1:
                                peerId = _a.sent();
                                peer = new peerjs_1["default"](peerId, this._peerServerCred);
                                peer.on('open', console.log);
                                peer.on('connection', this._registerDataCallbacks);
                                peer.on('disconnected', function () { return _this._peer = undefined; });
                                peer.on('error', function (err) { throw (err); });
                                peer.on('close', function () { return _this._peer = undefined; });
                                this._peer = peer;
                                peer.on('open', function () { return resolve(true); });
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/, promise];
            });
        });
    };
    OpenPayPeer.prototype._generatePeerId = function (virtualAddress, passcode) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Encryption.digest(virtualAddress + "#" + passcode)];
            });
        });
    };
    OpenPayPeer.prototype.activateListener = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._payIDClaim)
                            throw ("Need PayIDClaim setup!");
                        return [4 /*yield*/, this._initialisePeer().then(console.log)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    OpenPayPeer.prototype._connectToPeer = function (peerVirtualAddress, peerPasscode) {
        return __awaiter(this, void 0, void 0, function () {
            var peerIdentifier, dataConnection;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this._peer) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._initialisePeer().then(console.log)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this._generatePeerId(peerVirtualAddress, peerPasscode)];
                    case 3:
                        peerIdentifier = _a.sent();
                        return [4 /*yield*/, this._peer.connect(peerIdentifier, { label: "openpay" })];
                    case 4:
                        dataConnection = _a.sent();
                        this._registerDataCallbacks(dataConnection);
                        return [2 /*return*/, dataConnection];
                }
            });
        });
    };
    OpenPayPeer.prototype.sendPaymentRequest = function (receiverVirtualAddress, paymentRequest, passcode) {
        return __awaiter(this, void 0, void 0, function () {
            var receiverPasscode, dataConnection, encryptedPaymentRequest;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        receiverPasscode = passcode || prompt("Receiver passcode");
                        return [4 /*yield*/, this._connectToPeer(receiverVirtualAddress, receiverPasscode)
                            // Send the Payment Request
                        ];
                    case 1:
                        dataConnection = _a.sent();
                        // Send the Payment Request
                        paymentRequest = Object.assign(paymentRequest, { format: "openpay_v1" });
                        return [4 /*yield*/, Encryption.encryptJSON(paymentRequest, receiverPasscode)];
                    case 2:
                        encryptedPaymentRequest = _a.sent();
                        console.log("Encrypted Payment Request", encryptedPaymentRequest);
                        dataConnection.on('open', function () { dataConnection.send(encryptedPaymentRequest); });
                        return [2 /*return*/];
                }
            });
        });
    };
    return OpenPayPeer;
}(eventemitter3_1.EventEmitter));
var OpenPayWallet = /** @class */ (function (_super) {
    __extends(OpenPayWallet, _super);
    /**
     *
     */
    function OpenPayWallet() {
        return _super.call(this) || this;
    }
    return OpenPayWallet;
}(OpenPayPeer));
exports.OpenPayWallet = OpenPayWallet;
var OpenPayService = /** @class */ (function (_super) {
    __extends(OpenPayService, _super);
    /**
     *
     */
    function OpenPayService() {
        return _super.call(this) || this;
    }
    return OpenPayService;
}(OpenPayPeer));
exports.OpenPayService = OpenPayService;
