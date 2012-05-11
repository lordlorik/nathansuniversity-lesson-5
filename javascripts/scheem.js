scheem = (function () {
    var parseScheem;

    if (typeof module !== 'undefined') {
        var PEG = require('pegjs');
        var fs = require('fs');

        try {
            parseScheem = PEG.buildParser(fs.readFileSync('scheem.peg', 'utf-8')).parse;
        }
        catch (e) {
            parseScheem = PEG.buildParser(fs.readFileSync('../scheem.peg', 'utf-8')).parse;
        }
    }
    else {
        parseScheem = scheemParser.parse;
    };

    var builtinFunctions = {
        '+': function () {
            var len = arguments.length,
                sum = 0;

            if (len == 0) throw('Incorrect number of arguments');
            for (var i = 0; i < len; ++i) sum += checkNumber(arguments[i]);
            return sum;
        },

        '-': function (l, r) {
            var len = arguments.length;

            if (len > 2 || len < 1) throw('Incorrect number of arguments');
            return len == 1 ? -checkNumber(l) : checkNumber(l) - checkNumber(r);
        },

        '*': function () {
            var len = arguments.length,
                prod = 1;

            if (len == 0) throw('Incorrect number of arguments');
            for (var i = 0; i < len; ++i) prod *= checkNumber(arguments[i]);
            return prod;
        },

        '/': function (l, r) {
            if (arguments.length != 2) throw('Incorrect number of arguments');
            if (r === 0) throw('Division by zero');
            return l / r;
        },

        '%': function (l, r) {
            if (arguments.length != 2) throw('Incorrect number of arguments');
            if (r === 0) throw('Division by zero');
            return l % r;
        },

        '=': function (l, r) {
            if (arguments.length != 2) throw('Incorrect number of arguments');
            return toScheemBool(l === r);
        },

        '<>': function (l, r) {
            if (arguments.length != 2) throw('Incorrect number of arguments');
            return toScheemBool(l !== r);
        },

        '<': function (l, r) {
            if (arguments.length != 2) throw('Incorrect number of arguments');
            return toScheemBool(l < r);
        },

        '>': function (l, r) {
            if (arguments.length != 2) throw('Incorrect number of arguments');
            return toScheemBool(l > r);
        },

        '<=': function (l, r) {
            if (arguments.length != 2) throw('Incorrect number of arguments');
            return toScheemBool(l <= r);
        },

        '>=': function (l, r) {
            if (arguments.length != 2) throw('Incorrect number of arguments');
            return toScheemBool(l >= r);
        },

        'cons': function (elem, list) {
            if (arguments.length != 2) throw('Incorrect number of arguments');
            if (!isArray(list)) throw('Second argument must be a list');
            list = list.slice();
            list.unshift(elem);
            return list;
        },

        'car': function (list) {
            if (arguments.length != 1) throw('Incorrect number of arguments');
            if (!isArray(list)) throw('Second argument must be a list');
            if (!isArray(list) || !list.length) throw('First argument must be an non-empty list');
            return list[0];
        },

        'cdr': function (list) {
            if (arguments.length != 1) throw('Incorrect number of arguments');
            if (!isArray(list)) throw('Second argument must be a list');
            if (!isArray(list) || !list.length) throw('First argument must be an non-empty list');
            return list.slice(1);
        },

        'nil?': function (arg) {
            if (arguments.length != 1) throw('Incorrect number of arguments');
            return toScheemBool(arg === '#nil');
        },

        'zero?': function (arg) {
            if (arguments.length != 1) throw('Incorrect number of arguments');
            return toScheemBool(arg === 0);
        },

        'empty?': function (arg) {
            if (arguments.length != 1) throw('Incorrect number of arguments');
            return toScheemBool(isArray(arg) && arg.length === 0);
        },

        'list?': function (arg) {
            if (arguments.length != 1) throw('Incorrect number of arguments');
            return toScheemBool(isArray(arg));
        },

        'atom?': function (arg) {
            if (arguments.length != 1) throw('Incorrect number of arguments');
            return toScheemBool(typeof arg === 'string' && !isBool(arg) && arg !== '#nil');
        },

        'number?': function (arg) {
            if (arguments.length != 1) throw('Incorrect number of arguments');
            return toScheemBool(typeof arg === 'number');
        },

        'bool?': function (arg) {
            if (arguments.length != 1) throw('Incorrect number of arguments');
            return toScheemBool(isBool(arg));
        },

        'alert': function (msg) {
            alert(Array.prototype.slice.apply(arguments));
            return msg;
        }
    };

    var eval = function (string, env) {
        return evalScheem(parseScheem(string), env);
    };

    var evalScheem = function (expr, env) {
        if (env && !env.bindings) env = { bindings: env };
        if (!env) env = { bindings: {} }
        env.outer = {
            bindings: builtinFunctions
        };
        return _evalScheem(expr, env);
    };

    var isArray = function (obj) {
        return obj && obj instanceof Array;
    };

    var isBool = function (obj) {
        return obj && (obj === '#t' || obj === '#f');
    };

    var checkNumber = function (obj) {
        if (typeof obj !== 'number') throw('Invalid number: ' + obj);
        return obj;
    };

    var checkAtom = function (obj) {
        if (typeof obj !== 'string' || +obj == obj) throw('Invalid symbol: ' + obj);
        return obj;
    };

    var checkList = function (obj) {
        if (!isArray(obj)) throw('Invalid list: ' + obj);
        return obj;
    };

    var checkBool = function (obj) {
        if (!isBool(obj)) throw('Invalid bool: ' + obj);
        return obj;
    };

    var toScheemBool = function (arg) {
        return arg ? '#t' : '#f';
    };

    var lookupBinding = function (env, v) {
        if (!env) throw('Variable not defined: ' + v);
        if (v in env.bindings) return env.bindings[v];
        return lookupBinding(env.outer, v);
    };

    var updateBinding = function (env, v, val) {
        if (!env) throw('Symbol not defined: ' + v);
        if (v in env.bindings) return env.bindings[v] = val();
        return updateBinding(env.outer, v, val);
    };

    var addBinding = function (env, v, val) {
        if (v in env.bindings) throw('Symbol already defined: ' + v);
        return env.bindings[v] = val();
    };

    var _evalScheem = function (expr, env) {
        // Special error token
        if (expr === 'error') throw('Error');

        // True, False, Nil
        if (expr === '#t' || expr === '#f' || expr === '#nil') return expr;

        // Numbers evaluate to themselves
        if (typeof expr === 'number') return expr;

        // Strings are variable references
        if (typeof expr === 'string') return lookupBinding(env, expr);

        var len = expr.length,
            tmp, tmp2, tmp3, i;

        // Look at head of list for operation
        switch (expr[0]) {
            case 'define':
                if (len != 3) throw('Incorrect number of arguments');
                tmp = expr[1];
                checkAtom(tmp);
                addBinding(env, tmp, function () { return _evalScheem(expr[2], env); });
                return 0;

            case 'set!':
                if (len != 3) throw('Incorrect number of arguments');
                tmp = expr[1];
                checkAtom(tmp);
                return updateBinding(env, tmp, function () { return _evalScheem(expr[2], env); });

            case 'begin':
                tmp = '#nil';
                for (i = 1; i < len; ++i) tmp = _evalScheem(expr[i], env);
                return tmp;

            case 'quote':
                if (len != 2) throw('Incorrect number of arguments');
                return expr[1];

            case 'if':
                if (len > 4 || len < 2) throw('Incorrect number of arguments');
                tmp = _evalScheem(expr[1], env);
                if (tmp === '#t') return len > 2 ? _evalScheem(expr[2], env) : '#t';
                return len == 4 ? _evalScheem(expr[3], env) : '#f';

            case 'and':
                if (len < 2) throw('Incorrect number of arguments');
                for (i = 1; i < len; ++i) {
                    if (checkBool(_evalScheem(expr[i], env)) === '#f') return '#f';
                }
                return '#t';

            case 'or':
                if (len < 2) throw('Incorrect number of arguments');
                for (i = 1; i < len; ++i) {
                    if (checkBool(_evalScheem(expr[i], env)) === '#t') return '#t';
                }
                return '#f';

            case 'not':
                if (len != 2) throw('Incorrect number of arguments');
                return toScheemBool(checkBool(_evalScheem(expr[1], env)) === '#f');

            case 'let-one':
                if (len != 4) throw('Incorrect number of arguments');
                tmp = expr[1];
                checkAtom(tmp);
                tmp2 = {
                    outer: env,
                    bindings: { }
                };

                tmp2.bindings[tmp] = _evalScheem(expr[2], env);
                return _evalScheem(expr[3], tmp2);

            case 'let':
                if (len != 3) throw('Incorrect number of arguments');
                tmp = checkList(expr[1]);
                tmp2 = {
                    outer: env,
                    bindings: { }
                };

                for (i = 0; i < tmp.length; ++i) {
                    tmp3 = checkList(tmp[i]);
                    if (tmp3.length != 2) throw('Invalid binding');
                    checkAtom(tmp3[0]);
                    tmp2.bindings[tmp3[0]] = _evalScheem(tmp3[1], env);
                }
                return _evalScheem(expr[2], tmp2);

            case 'lambda-one':
                if (len != 3) throw('Incorrect number of arguments');
                tmp = expr[1];
                checkAtom(tmp);
                return function (arg) {
                    var newEnv = {
                        outer: env,
                        bindings: { }
                    };

                    newEnv.bindings[tmp] = arg;
                    return _evalScheem(expr[2], newEnv);
                };

            case 'lambda':
                if (len != 3) throw('Incorrect number of arguments');
                tmp = checkList(expr[1]);
                for (i = 0; i < tmp.length; ++i) checkAtom(tmp[i]);

                return function () {
                    var newEnv = {
                        outer: env,
                        bindings: { }
                    };

                    for (i = 0; i < tmp.length; ++i) newEnv.bindings[tmp[i]] = arguments[i];
                    return _evalScheem(expr[2], newEnv);
                };

            default:
                tmp = _evalScheem(expr[0], env);
                if (typeof tmp !== 'function') throw('Invalid expression');
                tmp2 = [];
                for (i = 1; i < len; ++i) tmp2.push(_evalScheem(expr[i], env));
                return tmp.apply(null, tmp2);
        }
    };

    return {
        eval: eval,
        evalScheem: evalScheem
    }
})();

// If we are used as Node module, export _evalScheem
if (typeof module !== 'undefined') {
    module.exports.eval = scheem.eval;
    module.exports.evalScheem = scheem.evalScheem;
}