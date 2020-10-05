import _defineProperty from '@babel/runtime/helpers/esm/defineProperty';
import _classCallCheck from '@babel/runtime/helpers/esm/classCallCheck';
import _createClass from '@babel/runtime/helpers/esm/createClass';
import _regeneratorRuntime from '@babel/runtime/regenerator';
import _toConsumableArray from '@babel/runtime/helpers/esm/toConsumableArray';
import _asyncToGenerator from '@babel/runtime/helpers/esm/asyncToGenerator';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var runHooks = function () {
  var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(hooks, args) {
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", Promise.all(hooks.map(function (handle) {
              var ret = handle.apply(void 0, _toConsumableArray(args));
              return ret && ret.then ? ret : Promise.resolve(ret);
            })));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function runHooks(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var I18next = function () {
  function I18next() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, I18next);

    this.isInitialized = false;
    this.extendOptionsHooks = [];
    this.loadResourcesHooks = [];
    this.resources = {};
    this.options = options;
  }

  _createClass(I18next, [{
    key: "throwIfAlreadyStarted",
    value: function throwIfAlreadyStarted(msg) {
      if (this.isInitialized) throw new Error(msg);
    }
  }, {
    key: "throwBecauseOfHookIfAlreadyStarted",
    value: function throwBecauseOfHookIfAlreadyStarted(hook) {
      this.throwIfAlreadyStarted("Cannot call \"addHook(".concat(hook, ")\" when fastify instance is already started!"));
    }
  }, {
    key: "addHook",
    value: function addHook(name, hook) {
      this.throwBecauseOfHookIfAlreadyStarted(name);
      if (name === 'extendOptions') this.extendOptionsHooks.push(hook);
      if (name === 'loadResources') this.loadResourcesHooks.push(hook);
      return this;
    }
  }, {
    key: "runExtendOptionsHooks",
    value: function () {
      var _runExtendOptionsHooks = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2() {
        var _this = this;

        var allOptions;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return runHooks(this.extendOptionsHooks, [_objectSpread({}, this.options)]);

              case 2:
                allOptions = _context2.sent;
                allOptions.forEach(function (opt) {
                  _this.options = _objectSpread(_objectSpread({}, opt), _this.options);
                });

              case 4:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function runExtendOptionsHooks() {
        return _runExtendOptionsHooks.apply(this, arguments);
      }

      return runExtendOptionsHooks;
    }()
  }, {
    key: "runLoadResourcesHooks",
    value: function () {
      var _runLoadResourcesHooks = _asyncToGenerator(_regeneratorRuntime.mark(function _callee3() {
        var resources, allResources;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                resources = {};
                _context3.next = 3;
                return runHooks(this.loadResourcesHooks, []);

              case 3:
                allResources = _context3.sent;
                allResources.forEach(function (res) {
                  resources = _objectSpread(_objectSpread({}, resources), res);
                });
                return _context3.abrupt("return", resources);

              case 6:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function runLoadResourcesHooks() {
        return _runLoadResourcesHooks.apply(this, arguments);
      }

      return runLoadResourcesHooks;
    }()
  }, {
    key: "init",
    value: function () {
      var _init = _asyncToGenerator(_regeneratorRuntime.mark(function _callee4() {
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.runExtendOptionsHooks();

              case 2:
                _context4.next = 4;
                return this.runLoadResourcesHooks();

              case 4:
                this.resources = _context4.sent;
                this.isInitialized = true;
                return _context4.abrupt("return", this);

              case 7:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function init() {
        return _init.apply(this, arguments);
      }

      return init;
    }()
  }, {
    key: "t",
    value: function t(key, options) {
      if (!this.isInitialized) throw new Error('i18next is not yet initialized!');
      return this.resources[key];
    }
  }]);

  return I18next;
}();

function i18next (options) {
  return new I18next(options);
}

export default i18next;
