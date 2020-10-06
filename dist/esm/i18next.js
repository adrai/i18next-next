import _regeneratorRuntime from '@babel/runtime/regenerator';
import _asyncToGenerator from '@babel/runtime/helpers/esm/asyncToGenerator';
import _defineProperty from '@babel/runtime/helpers/esm/defineProperty';
import _classCallCheck from '@babel/runtime/helpers/esm/classCallCheck';
import _createClass from '@babel/runtime/helpers/esm/createClass';
import _assertThisInitialized from '@babel/runtime/helpers/esm/assertThisInitialized';
import _inherits from '@babel/runtime/helpers/esm/inherits';
import _possibleConstructorReturn from '@babel/runtime/helpers/esm/possibleConstructorReturn';
import _getPrototypeOf from '@babel/runtime/helpers/esm/getPrototypeOf';
import { getDefaults } from './defaults.js';
import { hookNames, runHooks } from './hooks.js';
import { isIE10 } from './utils.js';
import EventEmitter from './EventEmitter.js';

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

var I18next = function (_EventEmitter) {
  _inherits(I18next, _EventEmitter);

  var _super = _createSuper(I18next);

  function I18next() {
    var _this;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, I18next);

    _this = _super.call(this);
    if (isIE10) EventEmitter.call(_assertThisInitialized(_this));
    _this.isInitialized = false;
    hookNames.forEach(function (name) {
      _this["".concat(name, "Hooks")] = [];
    });
    _this.resources = {};
    _this.options = _objectSpread(_objectSpread({}, getDefaults()), options);
    return _this;
  }

  _createClass(I18next, [{
    key: "throwIfAlreadyInitialized",
    value: function throwIfAlreadyInitialized(msg) {
      if (this.isInitialized) throw new Error(msg);
    }
  }, {
    key: "throwIfNotInitialized",
    value: function throwIfNotInitialized(msg) {
      if (!this.isInitialized) throw new Error(msg);
    }
  }, {
    key: "runExtendOptionsHooks",
    value: function () {
      var _runExtendOptionsHooks = _asyncToGenerator(_regeneratorRuntime.mark(function _callee() {
        var _this2 = this;

        var allOptions;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return runHooks(this.extendOptionsHooks, [_objectSpread({}, this.options)]);

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
      var _runLoadResourcesHooks = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2() {
        var allResources;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return runHooks(this.loadResourcesHooks, []);

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
    key: "runResolvePluralHooks",
    value: function runResolvePluralHooks(key, count, options) {
      var _iterator = _createForOfIteratorHelper(this.resolvePluralHooks),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var hook = _step.value;
          var resolvedKey = hook(key, count, options);
          if (resolvedKey !== undefined) return resolvedKey;
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }
  }, {
    key: "runTranslateHooks",
    value: function runTranslateHooks(key, options) {
      var _iterator2 = _createForOfIteratorHelper(this.translateHooks),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var hook = _step2.value;
          var resolvedValue = hook(key, this.resources, options);
          if (resolvedValue !== undefined) return resolvedValue;
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
  }, {
    key: "addHook",
    value: function addHook(name, hook) {
      if (hookNames.indexOf(name) < 0) throw new Error("".concat(name, " is not a valid hook!"));
      this.throwIfAlreadyInitialized("Cannot call \"addHook(".concat(name, ")\" when i18next instance is already initialized!"));
      this["".concat(name, "Hooks")].push(hook);
      return this;
    }
  }, {
    key: "init",
    value: function () {
      var _init = _asyncToGenerator(_regeneratorRuntime.mark(function _callee3() {
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this.throwIfAlreadyInitialized('Already initialized!');
                _context3.next = 3;
                return this.runExtendOptionsHooks();

              case 3:
                _context3.next = 5;
                return this.runLoadResourcesHooks();

              case 5:
                this.resources = _context3.sent;
                this.addHook('resolvePlural', function (key, count, options) {
                  return "".concat(key, "_plural");
                });
                this.addHook('translate', function (key, res, options) {
                  return res[key];
                });
                this.isInitialized = true;
                this.emit('initialized', this);
                return _context3.abrupt("return", this);

              case 11:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function init() {
        return _init.apply(this, arguments);
      }

      return init;
    }()
  }, {
    key: "t",
    value: function t(key) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      this.throwIfNotInitialized('Cannot use t function when i18next instance is not yet initialized!');

      if (options[this.options.pluralOptionProperty] !== undefined) {
        var resolvedKey = this.runResolvePluralHooks(key, options[this.options.pluralOptionProperty], options);
        return this.runTranslateHooks(resolvedKey, options);
      }

      return this.runTranslateHooks(key, options);
    }
  }]);

  return I18next;
}(EventEmitter);

function i18next (options) {
  return new I18next(options);
}

export default i18next;
