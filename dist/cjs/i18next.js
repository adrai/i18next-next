'use strict';

var _typeof = require('@babel/runtime/helpers/typeof');
var _regeneratorRuntime = require('@babel/runtime/regenerator');
var _asyncToGenerator = require('@babel/runtime/helpers/asyncToGenerator');
var _defineProperty = require('@babel/runtime/helpers/defineProperty');
var _classCallCheck = require('@babel/runtime/helpers/classCallCheck');
var _createClass = require('@babel/runtime/helpers/createClass');
var _assertThisInitialized = require('@babel/runtime/helpers/assertThisInitialized');
var _inherits = require('@babel/runtime/helpers/inherits');
var _possibleConstructorReturn = require('@babel/runtime/helpers/possibleConstructorReturn');
var _getPrototypeOf = require('@babel/runtime/helpers/getPrototypeOf');
var logger = require('./logger.js');
var defaults = require('./defaults.js');
var hooks = require('./hooks.js');
var utils = require('./utils.js');
var EventEmitter = require('./EventEmitter.js');
var LanguageUtils = require('./LanguageUtils.js');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _typeof__default = /*#__PURE__*/_interopDefaultLegacy(_typeof);
var _regeneratorRuntime__default = /*#__PURE__*/_interopDefaultLegacy(_regeneratorRuntime);
var _asyncToGenerator__default = /*#__PURE__*/_interopDefaultLegacy(_asyncToGenerator);
var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);
var _classCallCheck__default = /*#__PURE__*/_interopDefaultLegacy(_classCallCheck);
var _createClass__default = /*#__PURE__*/_interopDefaultLegacy(_createClass);
var _assertThisInitialized__default = /*#__PURE__*/_interopDefaultLegacy(_assertThisInitialized);
var _inherits__default = /*#__PURE__*/_interopDefaultLegacy(_inherits);
var _possibleConstructorReturn__default = /*#__PURE__*/_interopDefaultLegacy(_possibleConstructorReturn);
var _getPrototypeOf__default = /*#__PURE__*/_interopDefaultLegacy(_getPrototypeOf);

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf__default['default'](Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf__default['default'](this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn__default['default'](this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

var I18next = function (_EventEmitter) {
  _inherits__default['default'](I18next, _EventEmitter);

  var _super = _createSuper(I18next);

  function I18next() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck__default['default'](this, I18next);

    _this = _super.call(this);
    if (utils.isIE10) EventEmitter.call(_assertThisInitialized__default['default'](_this));
    _this.logger = logger;
    _this.isInitialized = false;
    hooks.hookNames.forEach(function (name) {
      _this["".concat(name, "Hooks")] = [];
    });
    _this.resources = {};
    _this.options = _objectSpread(_objectSpread({}, defaults.getDefaults()), options);
    _this.language = _this.options.lng;
    _this.services = {
      languageUtils: new LanguageUtils(_this.options)
    };
    return _this;
  }

  _createClass__default['default'](I18next, [{
    key: "throwIfAlreadyInitialized",
    value: function throwIfAlreadyInitialized(msg) {
      if (this.isInitialized) throw new Error(msg);
    }
  }, {
    key: "throwIfAlreadyInitializedFn",
    value: function throwIfAlreadyInitializedFn(fn) {
      this.throwIfAlreadyInitialized("Cannot call \"".concat(fn, "\" function when i18next instance is already initialized!"));
    }
  }, {
    key: "throwIfNotInitialized",
    value: function throwIfNotInitialized(msg) {
      if (!this.isInitialized) throw new Error(msg);
    }
  }, {
    key: "throwIfNotInitializedFn",
    value: function throwIfNotInitializedFn(fn) {
      this.throwIfNotInitialized("Cannot call \"".concat(fn, "\" function when i18next instance is not yet initialized!"));
    }
  }, {
    key: "runExtendOptionsHooks",
    value: function () {
      var _runExtendOptionsHooks = _asyncToGenerator__default['default'](_regeneratorRuntime__default['default'].mark(function _callee() {
        var _this2 = this;

        var allOptions;
        return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return hooks.runHooks(this.extendOptionsHooks, [_objectSpread({}, this.options)]);

              case 2:
                allOptions = _context.sent;
                allOptions.forEach(function (opt) {
                  _this2.options = _objectSpread(_objectSpread({}, opt), _this2.options);
                });

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function runExtendOptionsHooks() {
        return _runExtendOptionsHooks.apply(this, arguments);
      }

      return runExtendOptionsHooks;
    }()
  }, {
    key: "runLoadResourcesHooks",
    value: function () {
      var _runLoadResourcesHooks = _asyncToGenerator__default['default'](_regeneratorRuntime__default['default'].mark(function _callee2() {
        var allResources;
        return _regeneratorRuntime__default['default'].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return hooks.runHooks(this.loadResourcesHooks, [this.options]);

              case 2:
                allResources = _context2.sent;
                return _context2.abrupt("return", allResources.reduce(function (prev, curr) {
                  return _objectSpread(_objectSpread({}, prev), curr);
                }, {}));

              case 4:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function runLoadResourcesHooks() {
        return _runLoadResourcesHooks.apply(this, arguments);
      }

      return runLoadResourcesHooks;
    }()
  }, {
    key: "runDetectLanguageHooks",
    value: function () {
      var _runDetectLanguageHooks = _asyncToGenerator__default['default'](_regeneratorRuntime__default['default'].mark(function _callee3() {
        var _iterator, _step, hook, ret, lngs;

        return _regeneratorRuntime__default['default'].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _iterator = _createForOfIteratorHelper(this.detectLanguageHooks);
                _context3.prev = 1;

                _iterator.s();

              case 3:
                if ((_step = _iterator.n()).done) {
                  _context3.next = 14;
                  break;
                }

                hook = _step.value;
                ret = hook();
                _context3.next = 8;
                return ret && ret.then ? ret : Promise.resolve(ret);

              case 8:
                lngs = _context3.sent;
                if (lngs && typeof lngs === 'string') lngs = [lngs];

                if (!lngs) {
                  _context3.next = 12;
                  break;
                }

                return _context3.abrupt("return", lngs);

              case 12:
                _context3.next = 3;
                break;

              case 14:
                _context3.next = 19;
                break;

              case 16:
                _context3.prev = 16;
                _context3.t0 = _context3["catch"](1);

                _iterator.e(_context3.t0);

              case 19:
                _context3.prev = 19;

                _iterator.f();

                return _context3.finish(19);

              case 22:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[1, 16, 19, 22]]);
      }));

      function runDetectLanguageHooks() {
        return _runDetectLanguageHooks.apply(this, arguments);
      }

      return runDetectLanguageHooks;
    }()
  }, {
    key: "runCacheLanguageHooks",
    value: function () {
      var _runCacheLanguageHooks = _asyncToGenerator__default['default'](_regeneratorRuntime__default['default'].mark(function _callee4(lng) {
        return _regeneratorRuntime__default['default'].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                return _context4.abrupt("return", hooks.runHooks(this.cacheLanguageHooks, [lng]));

              case 1:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function runCacheLanguageHooks(_x) {
        return _runCacheLanguageHooks.apply(this, arguments);
      }

      return runCacheLanguageHooks;
    }()
  }, {
    key: "runResolvePluralHooks",
    value: function runResolvePluralHooks(count, key, ns, lng, options) {
      var _iterator2 = _createForOfIteratorHelper(this.resolvePluralHooks),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var hook = _step2.value;
          var resolvedKey = hook(count, key, ns, lng, options);
          if (resolvedKey !== undefined) return resolvedKey;
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
  }, {
    key: "runTranslateHooks",
    value: function runTranslateHooks(key, ns, lng, options) {
      var _iterator3 = _createForOfIteratorHelper(this.translateHooks),
          _step3;

      try {
        for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
          var hook = _step3.value;
          var resolvedValue = hook(key, ns, lng, this.resources, options);
          if (resolvedValue !== undefined) return resolvedValue;
        }
      } catch (err) {
        _iterator3.e(err);
      } finally {
        _iterator3.f();
      }
    }
  }, {
    key: "calculateSeenNamespaces",
    value: function calculateSeenNamespaces() {
      var _this3 = this;

      var namespaces = [];
      Object.keys(this.resources).forEach(function (lng) {
        Object.keys(_this3.resources[lng]).forEach(function (ns) {
          if (namespaces.indexOf(ns) < 0) namespaces.push(ns);
        });
      });
      if (namespaces.indexOf(this.options.defaultNS) < 0) namespaces.push(this.options.defaultNS);
      this.seenNamespaces = namespaces;
    }
  }, {
    key: "use",
    value: function use(module) {
      if (!module) throw new Error('You are passing an undefined module! Please check the object you are passing to i18next.use()');
      if (module.type) throw new Error('You are probably passing an old module! Please check the object you are passing to i18next.use()');
      if (typeof module.register !== 'function') throw new Error('You are passing a wrong module! Please check the object you are passing to i18next.use()');
      module.register(this);
      return this;
    }
  }, {
    key: "addHook",
    value: function addHook(name, hook) {
      if (hooks.hookNames.indexOf(name) < 0) throw new Error("".concat(name, " is not a valid hook!"));
      this.throwIfAlreadyInitializedFn("addHook(".concat(name, ")"));
      this["".concat(name, "Hooks")].push(hook);
      return this;
    }
  }, {
    key: "init",
    value: function () {
      var _init = _asyncToGenerator__default['default'](_regeneratorRuntime__default['default'].mark(function _callee5() {
        var _this4 = this;

        var toLoad;
        return _regeneratorRuntime__default['default'].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                this.throwIfAlreadyInitialized('Already initialized!');
                _context5.next = 3;
                return this.runExtendOptionsHooks();

              case 3:
                this.language = this.options.lng;
                _context5.next = 6;
                return this.runLoadResourcesHooks();

              case 6:
                this.resources = _context5.sent;
                this.calculateSeenNamespaces();
                this.addHook('resolvePlural', function (count, key, ns, lng, options) {
                  return "".concat(key, "_plural");
                });
                this.addHook('translate', function (key, ns, lng, res, options) {
                  return res[lng][ns][key];
                });
                if (this.language && this.options.preload.indexOf(this.language) < 0) this.options.preload.unshift(this.language);
                this.isInitialized = true;
                this.emit('initialized', this);

                if (!(this.options.preload.length > 0)) {
                  _context5.next = 17;
                  break;
                }

                toLoad = this.options.preload.reduce(function (prev, curr) {
                  prev[curr] = _this4.seenNamespaces;
                  return prev;
                }, {});
                _context5.next = 17;
                return this.load(toLoad);

              case 17:
                _context5.next = 19;
                return this.changeLanguage(this.language);

              case 19:
                return _context5.abrupt("return", this);

              case 20:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function init() {
        return _init.apply(this, arguments);
      }

      return init;
    }()
  }, {
    key: "load",
    value: function () {
      var _load = _asyncToGenerator__default['default'](_regeneratorRuntime__default['default'].mark(function _callee6(toLoad) {
        var _this5 = this;

        var _iterator4, _step4, _loop, _ret;

        return _regeneratorRuntime__default['default'].wrap(function _callee6$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                this.throwIfNotInitializedFn('load');
                _iterator4 = _createForOfIteratorHelper(this.readHooks);
                _context7.prev = 2;
                _loop = _regeneratorRuntime__default['default'].mark(function _loop() {
                  var hook, ret, read;
                  return _regeneratorRuntime__default['default'].wrap(function _loop$(_context6) {
                    while (1) {
                      switch (_context6.prev = _context6.next) {
                        case 0:
                          hook = _step4.value;
                          ret = hook(toLoad);
                          _context6.next = 4;
                          return ret && ret.then ? ret : Promise.resolve(ret);

                        case 4:
                          read = _context6.sent;

                          if (read) {
                            _context6.next = 7;
                            break;
                          }

                          return _context6.abrupt("return", "continue");

                        case 7:
                          Object.keys(read).forEach(function (lng) {
                            Object.keys(read[lng]).forEach(function (ns) {
                              _this5.resources[lng] = _this5.resources[lng] || {};
                              _this5.resources[lng][ns] = read[lng][ns];
                            });
                          });

                          _this5.calculateSeenNamespaces();

                          return _context6.abrupt("return", {
                            v: void 0
                          });

                        case 10:
                        case "end":
                          return _context6.stop();
                      }
                    }
                  }, _loop);
                });

                _iterator4.s();

              case 5:
                if ((_step4 = _iterator4.n()).done) {
                  _context7.next = 14;
                  break;
                }

                return _context7.delegateYield(_loop(), "t0", 7);

              case 7:
                _ret = _context7.t0;

                if (!(_ret === "continue")) {
                  _context7.next = 10;
                  break;
                }

                return _context7.abrupt("continue", 12);

              case 10:
                if (!(_typeof__default['default'](_ret) === "object")) {
                  _context7.next = 12;
                  break;
                }

                return _context7.abrupt("return", _ret.v);

              case 12:
                _context7.next = 5;
                break;

              case 14:
                _context7.next = 19;
                break;

              case 16:
                _context7.prev = 16;
                _context7.t1 = _context7["catch"](2);

                _iterator4.e(_context7.t1);

              case 19:
                _context7.prev = 19;

                _iterator4.f();

                return _context7.finish(19);

              case 22:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee6, this, [[2, 16, 19, 22]]);
      }));

      function load(_x2) {
        return _load.apply(this, arguments);
      }

      return load;
    }()
  }, {
    key: "loadNamespace",
    value: function () {
      var _loadNamespace = _asyncToGenerator__default['default'](_regeneratorRuntime__default['default'].mark(function _callee7(ns, lng) {
        return _regeneratorRuntime__default['default'].wrap(function _callee7$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                this.throwIfNotInitializedFn('loadNamespace');
                if (!lng) lng = this.language;

                if (lng) {
                  _context8.next = 4;
                  break;
                }

                throw new Error('There is no language defined!');

              case 4:
                return _context8.abrupt("return", this.load(_defineProperty__default['default']({}, lng, [ns])));

              case 5:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee7, this);
      }));

      function loadNamespace(_x3, _x4) {
        return _loadNamespace.apply(this, arguments);
      }

      return loadNamespace;
    }()
  }, {
    key: "isLanguageLoaded",
    value: function isLanguageLoaded(lng) {
      this.throwIfNotInitializedFn('isLanguageLoaded');
      return this.resources[lng];
    }
  }, {
    key: "isNamespaceLoaded",
    value: function isNamespaceLoaded(ns, lng) {
      this.throwIfNotInitializedFn('isNamespaceLoaded');
      if (!lng) lng = this.language;
      if (!lng) throw new Error('There is no language defined!');
      return this.resources[lng] && this.resources[lng][ns];
    }
  }, {
    key: "changeLanguage",
    value: function () {
      var _changeLanguage = _asyncToGenerator__default['default'](_regeneratorRuntime__default['default'].mark(function _callee8(lng) {
        return _regeneratorRuntime__default['default'].wrap(function _callee8$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                if (lng) {
                  _context9.next = 4;
                  break;
                }

                _context9.next = 3;
                return this.runDetectLanguageHooks();

              case 3:
                lng = _context9.sent;

              case 4:
                lng = typeof lng === 'string' ? lng : this.services.languageUtils.getBestMatchFromCodes(lng);

                if (lng) {
                  _context9.next = 7;
                  break;
                }

                return _context9.abrupt("return");

              case 7:
                this.emit('languageChanging', lng);
                _context9.next = 10;
                return this.load(_defineProperty__default['default']({}, lng, this.seenNamespaces));

              case 10:
                this.language = lng;
                _context9.next = 13;
                return this.runCacheLanguageHooks(this.language);

              case 13:
                this.emit('languageChanged', lng);
                this.logger.log('languageChanged', lng);

              case 15:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee8, this);
      }));

      function changeLanguage(_x5) {
        return _changeLanguage.apply(this, arguments);
      }

      return changeLanguage;
    }()
  }, {
    key: "t",
    value: function t(key) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      this.throwIfNotInitializedFn('t');
      var lng = options.lng || this.language;
      if (!lng) throw new Error('There is no language defined!');
      var ns = options.ns || this.options.defaultNS;

      if (!this.isLanguageLoaded(lng)) {
        this.logger.warn("Language ".concat(lng, " not loaded!"));
        return undefined;
      }

      if (!this.isNamespaceLoaded(ns, lng)) {
        this.logger.warn("Namespace ".concat(ns, " for language ").concat(lng, " not loaded!"));
        return undefined;
      }

      if (options[this.options.pluralOptionProperty] !== undefined) {
        var resolvedKey = this.runResolvePluralHooks(options[this.options.pluralOptionProperty], key, ns, lng, options);
        return this.runTranslateHooks(resolvedKey, ns, lng, options);
      }

      return this.runTranslateHooks(key, ns, lng, options);
    }
  }]);

  return I18next;
}(EventEmitter);

function i18next (options) {
  return new I18next(options);
}

module.exports = i18next;
