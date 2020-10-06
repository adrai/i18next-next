import _regeneratorRuntime from '@babel/runtime/regenerator';
import _asyncToGenerator from '@babel/runtime/helpers/esm/asyncToGenerator';
import _toConsumableArray from '@babel/runtime/helpers/esm/toConsumableArray';

var hookNames = ['extendOptions', 'loadResources', 'resolvePlural', 'translate'];
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

export { hookNames, runHooks };
