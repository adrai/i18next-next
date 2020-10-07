'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _regeneratorRuntime = require('@babel/runtime/regenerator');
var _asyncToGenerator = require('@babel/runtime/helpers/asyncToGenerator');
var _toConsumableArray = require('@babel/runtime/helpers/toConsumableArray');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _regeneratorRuntime__default = /*#__PURE__*/_interopDefaultLegacy(_regeneratorRuntime);
var _asyncToGenerator__default = /*#__PURE__*/_interopDefaultLegacy(_asyncToGenerator);
var _toConsumableArray__default = /*#__PURE__*/_interopDefaultLegacy(_toConsumableArray);

var hookNames = ['extendOptions', 'loadResources', 'resolvePlural', 'translate', 'read', 'detectLanguage', 'cacheLanguage'];
var runHooks = function () {
  var _ref = _asyncToGenerator__default['default'](_regeneratorRuntime__default['default'].mark(function _callee(hooks, args) {
    return _regeneratorRuntime__default['default'].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", Promise.all(hooks.map(function (handle) {
              var ret = handle.apply(void 0, _toConsumableArray__default['default'](args));
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

exports.hookNames = hookNames;
exports.runHooks = runHooks;
