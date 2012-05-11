var parseScheem, evalScheem, evalScheemString, assert, expect;

if (typeof module !== 'undefined') {
    // In Node load required modules
    var chai = require('chai');
    var mocha = require('mocha');

    assert = chai.assert;
    expect = chai.expect;

    var PEG = require('pegjs');
    var fs = require('fs');
    var scheem = require('../scheem');

    try {
        parseScheem = PEG.buildParser(fs.readFileSync('scheem.peg', 'utf-8')).parse;
    }
    catch (e) {
        parseScheem = PEG.buildParser(fs.readFileSync('../scheem.peg', 'utf-8')).parse;
    }
    evalScheem = scheem.evalScheem;
    evalScheemString = scheem.eval;
}
else {
    // In browser assume already loaded by <script> tags
    assert = chai.assert;
    expect = chai.expect;

    evalScheem = scheem.evalScheem;
    evalScheemString = scheem.eval;
    parseScheem = scheemParser.parse;
}

suite('define', function () {
    test('define', function () {
        var env = { bindings: { b: 1 } };

        evalScheem(['define', 'a', 3], env);
        assert.deepEqual(
            env.bindings,
            { a: 3, b: 1 }
        );
    });
    test('define expression', function () {
        var env = { bindings: { b: 1 } };

        evalScheem(['define', 'a', ['+', 'b', 3]], env);
        assert.deepEqual(
            env.bindings,
            { a: 4, b: 1 }
        );
    });
    test('define already defined', function () {
        expect(function () {
            evalScheem(['define', 'a', 3], { a: 5 });
        }).to.throw();
    });
    test('define too few parameters', function () {
        expect(function () {
            evalScheem(['define', 'a']);
        }).to.throw();
    });
    test('define too many parameters', function () {
        expect(function () {
            evalScheem(['define', 'a', 3, 4]);
        }).to.throw();
    });
    test('define invalid symbol', function () {
        expect(function () {
            evalScheem(['define', '5', 3]);
        }).to.throw();
    });
});

suite('set!', function () {
    test('set!', function () {
        var env = { bindings: { a: 4, b: 1 } };

        evalScheem(['set!', 'a', 3], env);
        assert.deepEqual(
            env.bindings,
            { a: 3, b: 1 }
        );
    });
    test('set! expression', function () {
        var env = { bindings: { a: 4, b: 1 } };

        evalScheem(['set!', 'a', ['+', 1, 2]], env);
        assert.deepEqual(
            env.bindings,
            { a: 3, b: 1 }
        );
    });
    test('set! not yet defined', function () {
        expect(function () {
            evalScheem(['set!', 'a', 3]);
        }).to.throw();
    });
    test('set! too few parameters', function () {
        expect(function () {
            evalScheem(['set!', 'a']);
        }).to.throw();
    });
    test('set! too many parameters', function () {
        expect(function () {
            evalScheem(['set!', 'a', 3, 4]);
        }).to.throw();
    });
    test('set! invalid symbol', function () {
        expect(function () {
            evalScheem(['set!', '5', 3]);
        }).to.throw();
    });
});

suite('quote', function () {
    test('quote a number', function () {
        assert.deepEqual(
            evalScheem(['quote', 3]),
            3
        );
    });
    test('quote an atom', function () {
        assert.deepEqual(
            evalScheem(['quote', 'dog']),
            'dog'
        );
    });
    test('quote a list', function () {
        assert.deepEqual(
            evalScheem(['quote', [1, 2, 3]]),
            [1, 2, 3]
        );
    });
    test('quote too few parameters', function () {
        expect(function () {
            evalScheem(['quote']);
        }).to.throw();
    });
    test('quote too many parameters', function () {
        expect(function () {
            evalScheem(['quote', [1], 2]);
        }).to.throw();
    });
});

suite('cons', function () {
    test('cons a number', function () {
        assert.deepEqual(
            evalScheem(['cons', 1, ['quote', [2, 3]]]),
            [1, 2, 3]
        );
    });
    test('cons a list', function () {
        assert.deepEqual(
            evalScheem(['cons', ['quote', [1, 2]], ['quote', [2, 3]]]),
            [[1, 2], 2, 3]
        );
    });
    test('cons too few parameters', function () {
        expect(function () {
            evalScheem(['cons', 1]);
        }).to.throw();
    });
    test('cons too many parameters', function () {
        expect(function () {
            evalScheem(['cons', 1, [2], [3]]);
        }).to.throw();
    });
});

suite('car', function () {
    test('car a list', function () {
        assert.deepEqual(
            evalScheem(['car', ['quote', [[2, 3], 3, 4]]]),
            [2, 3]
        );
    });
    test('car a number', function () {
        assert.deepEqual(
            evalScheem(['car', ['quote', [1, 2]]]),
            1
        );
    });
    test('car empty list', function () {
        expect(function () {
            evalScheem(['car', ['quote', []]]);
        }).to.throw();
    });
    test('car too few parameters', function () {
        expect(function () {
            evalScheem(['car']);
        }).to.throw();
    });
    test('car too many parameters', function () {
        expect(function () {
            evalScheem(['car', ['quote', [1, 2]], 3]);
        }).to.throw();
    });
    test('car non list', function () {
        expect(function () {
            evalScheem(['car', 1]);
        }).to.throw();
    });
});

suite('cdr', function () {
    test('cdr a list', function () {
        assert.deepEqual(
            evalScheem(['cdr', ['quote', [1, 3, 4]]]),
            [3, 4]
        );
    });
    test('cdr a single element list', function () {
        assert.deepEqual(
            evalScheem(['cdr', ['quote', [1]]]),
            []
        );
    });
    test('cdr an empty list', function () {
        expect(function () {
            evalScheem(['cdr', ['quote', []]]);
        }).to.throw();
    });
    test('cdr too many parameters', function () {
        expect(function () {
            evalScheem(['cdr', ['quote', [1, 2]], 3]);
        }).to.throw();
    });
    test('cdr non list', function () {
        expect(function () {
            evalScheem(['cdr', 3]);
        }).to.throw();
    });
});

suite('begin', function () {
    test('begin nothing', function () {
        assert.deepEqual(
            evalScheem(['begin']),
            '#nil'
        );
    });
    test('begin numbers', function () {
        assert.deepEqual(
            evalScheem(['begin', 1, 2, 3]),
            3
        );
    });
    test('begin expressions', function () {
        assert.deepEqual(
            evalScheem(['begin', ['+', 1, 2], ['+', 2, 3], ['+', 3, 4]]),
            7
        );
    });
    test('begin change environment', function () {
        var env = { bindings: { a: 4 } };

        evalScheem(['begin', ['set!', 'a', 3]], env);
        assert.deepEqual(
            env.bindings,
            { a: 3 }
        );
    });
    test('begin track environment', function () {
        var env = { bindings: { a: 4 } };

        assert.deepEqual(
            evalScheem(['begin', ['set!', 'a', 3], ['+', 'a', 2]], env),
            5
        );
    });
});

suite('if & bool operators', function () {
    test('if cond true, two branches', function () {
        assert.deepEqual(
            evalScheem(['if', ['=', 1, 1], 2, 3]),
            2
        );
    });
    test('if cond false, two branches', function () {
        assert.deepEqual(
            evalScheem(['if', ['<>', 1, 1], 2, 3]),
            3
        );
    });
    test('if cond true, one branch', function () {
        assert.deepEqual(
            evalScheem(['if', ['=', 1, 1], 2]),
            2
        );
    });
    test('if cond false, one branch', function () {
        assert.deepEqual(
            evalScheem(['if', ['<>', 1, 1], 2]),
            '#f'
        );
    });
    test('if cond true, no branches', function () {
        assert.deepEqual(
            evalScheem(['if', ['=', 1, 1]]),
            '#t'
        );
    });
    test('if cond false, no branches', function () {
        assert.deepEqual(
            evalScheem(['if', ['<>', 1, 1]]),
            '#f'
        );
    });
    test('if too many parameters', function () {
        expect(function () {
            evalScheem(['if', '#t', 4, 5, 6]);
        }).to.throw();
    });
    test('if no parameters', function () {
        expect(function () {
            evalScheem(['if']);
        }).to.throw();
    });
    test('if invalid condition', function () {
        expect(function () {
            evalScheem(['if', 'x']);
        }).to.throw();
    });
    test('and true', function () {
        assert.deepEqual(
            evalScheem(['and', '#t']),
            '#t'
        );
    });
    test('and false', function () {
        assert.deepEqual(
            evalScheem(['and', '#f']),
            '#f'
        );
    });
    test('and true & true', function () {
        assert.deepEqual(
            evalScheem(['and', '#t', '#t']),
            '#t'
        );
    });
    test('and true & false', function () {
        assert.deepEqual(
            evalScheem(['and', '#t', '#f']),
            '#f'
        );
    });
    test('and false & false', function () {
        assert.deepEqual(
            evalScheem(['and', '#f', '#f']),
            '#f'
        );
    });
    test('and false & true', function () {
        assert.deepEqual(
            evalScheem(['and', '#f', '#t']),
            '#f'
        );
    });
    test('and short circuit', function () {
        assert.deepEqual(
            evalScheem(['and', '#f', 'error']),
            '#f'
        );
    });
    test('and non boolean', function () {
        expect(function () {
            evalScheem(['and', 1, 'a']);
        }).to.throw();
    });
    test('and too few parameters', function () {
        expect(function () {
            evalScheem(['and']);
        }).to.throw();
    });
    test('or true', function () {
        assert.deepEqual(
            evalScheem(['or', '#t']),
            '#t'
        );
    });
    test('or false', function () {
        assert.deepEqual(
            evalScheem(['or', '#f']),
            '#f'
        );
    });
    test('or true & true', function () {
        assert.deepEqual(
            evalScheem(['or', '#t', '#t']),
            '#t'
        );
    });
    test('or true & false', function () {
        assert.deepEqual(
            evalScheem(['or', '#t', '#f']),
            '#t'
        );
    });
    test('or false & false', function () {
        assert.deepEqual(
            evalScheem(['or', '#f', '#f']),
            '#f'
        );
    });
    test('or false & true', function () {
        assert.deepEqual(
            evalScheem(['or', '#f', '#t']),
            '#t'
        );
    });
    test('or short circuit', function () {
        assert.deepEqual(
            evalScheem(['or', '#t', 'error']),
            '#t'
        );
    });
    test('or non boolean', function () {
        expect(function () {
            evalScheem(['or', 1, 'a']);
        }).to.throw();
    });
    test('or too few parameters', function () {
        expect(function () {
            evalScheem(['or']);
        }).to.throw();
    });
    test('not true', function () {
        assert.deepEqual(
            evalScheem(['not', '#t']),
            '#f'
        );
    });
    test('not false', function () {
        assert.deepEqual(
            evalScheem(['not', '#f']),
            '#t'
        );
    });
    test('not non boolean', function () {
        expect(function () {
            evalScheem(['not', 1]);
        }).to.throw();
    });
    test('not too few parameters', function () {
        expect(function () {
            evalScheem(['not']);
        }).to.throw();
    });
    test('not too many parameters', function () {
        expect(function () {
            evalScheem(['not', '#t', '#f']);
        }).to.throw();
    });
});

suite('let-one & let', function () {
    test('let-one evaluation & scoping', function () {
        var env = { bindings: { a: 4, b: 1 } };

        assert.deepEqual(
            evalScheem(['let-one', 'a', 3, ['+', 'a', 'b']], env),
            4
        );
    });
    test('let-one environment preservation', function () {
        var env = { bindings: { a: 4, b: 1 } };

        evalScheem(['let-one', 'a', 3, ['+', 'a', 2]], env)
        assert.deepEqual(
            env.bindings,
            { a: 4, b: 1 }
        );
    });
    test('let-one too few parameters', function () {
        expect(function () {
            evalScheem(['let-one', 'a', 3]);
        }).to.throw();
    });
    test('let-one too many parameters', function () {
        expect(function () {
            evalScheem(['let-one', 'a', 3, ['+', 'a', 2], 'x']);
        }).to.throw();
    });
    test('let-one invalid symbol', function () {
        expect(function () {
            evalScheem(['let-one', '5', 3, ['+', 'a', 2]]);
        }).to.throw();
    });
    test('let evaluation & scoping', function () {
        var env = { bindings: { a: 4, b: 1 } };

        assert.deepEqual(
            evalScheem(['let', [['a', 3]], ['+', 'a', 'b']], env),
            4
        );
    });
    test('let many bindings', function () {
        var env = { bindings: { a: 4, b: 1 } };

        assert.deepEqual(
            evalScheem(['let', [['a', 6], ['b', 4]], ['+', 'a', 'b']], env),
            10
        );
    });
    test('let no bindings', function () {
        var env = { bindings: { a: 4, b: 1 } };

        assert.deepEqual(
            evalScheem(['let', [], ['+', 'a', 'b']], env),
            5
        );
    });
    test('let environment preservation', function () {
        var env = { bindings: { a: 4, b: 1 } };

        evalScheem(['let', [['a', 3]], ['+', 'a', 2]], env)
        assert.deepEqual(
            env.bindings,
            { a: 4, b: 1 }
        );
    });
    test('let too few parameters', function () {
        expect(function () {
            evalScheem(['let', [['a', 3]]]);
        }).to.throw();
    });
    test('let too many parameters', function () {
        expect(function () {
            evalScheem(['let', [['a', 3]], ['+', 'a', 2], 'x']);
        }).to.throw();
    });
    test('let invalid symbol', function () {
        expect(function () {
            evalScheem(['let', [['5', 3]], ['+', 'a', 2]]);
        }).to.throw();
    });
    test('let invalid bindings', function () {
        expect(function () {
            evalScheem(['let', 'x', ['+', 'a', 2]]);
        }).to.throw();
    });
});

suite('lambda-one & lambda', function () {
    test('lambda-one evaluation & scoping', function () {
        var env = { bindings: { a: 4, b: 1 } };

        assert.deepEqual(
            evalScheem(['lambda-one', 'x', ['+', 'x', 'a']], env)(3),
            7
        );
    });
    test('lambda-one environment preservation', function () {
        var env = { bindings: { a: 4, b: 1 } };

        evalScheem(['lambda-one', 'a', ['*', 'a', 2]], env)(3)
        assert.deepEqual(
            env.bindings,
            { a: 4, b: 1 }
        );
    });
    test('lambda-one anonymous invocation', function () {
        var env = { bindings: { a: 4, b: 1 } };

        assert.deepEqual(
            evalScheem([['lambda-one', 'x', ['+', 'x', 'a']], 3], env),
            7
        );
    });
    test('lambda-one too many parameters', function () {
        expect(function () {
            evalScheem(['lambda-one', 'a', ['*', 'a', 2], 'x']);
        }).to.throw();
    });
    test('lambda-one invalid symbol', function () {
        expect(function () {
            evalScheem(['lambda-one', '5', ['*', '5', 2]]);
        }).to.throw();
    });

    test('lambda evaluation & scoping', function () {
        var env = { bindings: { a: 4, b: 1 } };

        assert.deepEqual(
            evalScheem(['lambda', ['x'], ['+', 'x', 'a']], env)(3),
            7
        );
    });
    test('lambda many bindings', function () {
        var env = { bindings: { a: 4, b: 1 } };

        assert.deepEqual(
            evalScheem(['lambda', ['x', 'y'], ['+', 'x', 'y', 'b']], env)(3, 4),
            8
        );
    });
    test('lambda no bindings', function () {
        var env = { bindings: { a: 4, b: 1 } };

        assert.deepEqual(
            evalScheem(['lambda', [], ['+', 'a', 'b']], env)(),
            5
        );
    });
    test('lambda environment preservation', function () {
        var env = { bindings: { a: 4, b: 1 } };

        evalScheem(['lambda', ['a'], ['*', 'a', 2]], env)(3)
        assert.deepEqual(
            env.bindings,
            { a: 4, b: 1 }
        );
    });
    test('lambda anonymous invocation', function () {
        assert.deepEqual(
            evalScheem([['lambda', ['x', 'y'], ['+', 'x', 'y']], 3, 2]),
            5
        );
    });
    test('lambda too many parameters', function () {
        expect(function () {
            evalScheem(['lambda', ['a'], ['*', 'a', 2], 'x']);
        }).to.throw();
    });
    test('lambda invalid symbol', function () {
        expect(function () {
            evalScheem(['lambda', ['5'], ['*', '5', 2]]);
        }).to.throw();
    });
    test('lambda invalid bindings', function () {
        expect(function () {
            evalScheem(['lambda', 'x', ['*', 'x', 2]]);
        }).to.throw();
    });
});
suite('math', function () {
    test('add', function () {
        assert.deepEqual(
            evalScheem(['+', 1, 2]),
            3
        );
    });
    test('add single', function () {
        assert.deepEqual(
            evalScheem(['+', 1]),
            1
        );
    });
    test('add negative', function () {
        assert.deepEqual(
            evalScheem(['+', 1, -2]),
            -1
        );
    });
    test('add many', function () {
        assert.deepEqual(
            evalScheem(['+', 1, 2, 3]),
            6
        );
    });
    test('add invalid', function () {
        expect(function () {
            evalScheem(['+', 1, [2]]);
        }).to.throw();
    });
    test('add too few arguments', function () {
        expect(function () {
            evalScheem(['+']);
        }).to.throw();
    });
    test('subtract', function () {
        assert.deepEqual(
            evalScheem(['-', 1, 2]),
            -1
        );
    });
    test('subtract negative', function () {
        assert.deepEqual(
            evalScheem(['-', 1, -2]),
            3
        );
    });
    test('substract invalid', function () {
        expect(function () {
            evalScheem(['-', 1, [2]]);
        }).to.throw();
    });
    test('substract too few arguments', function () {
        expect(function () {
            evalScheem(['-']);
        }).to.throw();
    });
    test('substract too many arguments', function () {
        expect(function () {
            evalScheem(['-', 2, 3, 4]);
        }).to.throw();
    });
    test('unary minus', function () {
        assert.deepEqual(
            evalScheem(['-', 1]),
            -1
        );
    });
    test('unary minus invalid', function () {
        expect(function () {
            evalScheem(['-', [2]]);
        }).to.throw();
    });
    test('multiply', function () {
        assert.deepEqual(
            evalScheem(['*', 3, 2]),
            6
        );
    });
    test('multiply negative', function () {
        assert.deepEqual(
            evalScheem(['*', -1, 2]),
            -2
        );
    });
    test('multiply single', function () {
        assert.deepEqual(
            evalScheem(['*', 3]),
            3
        );
    });
    test('multiply many', function () {
        assert.deepEqual(
            evalScheem(['*', 2, 3, 4]),
            24
        );
    });
    test('multiply invalid', function () {
        expect(function () {
            evalScheem(['*', 1, [2]]);
        }).to.throw();
    });
    test('multiply too few arguments', function () {
        expect(function () {
            evalScheem(['*']);
        }).to.throw();
    });
    test('divide', function () {
        assert.deepEqual(
            evalScheem(['/', 12, 3]),
            4
        );
    });
    test('divide invalid', function () {
        expect(function () {
            evalScheem(['/', 1, [2]]);
        }).to.throw();
    });
    test('divide too few arguments', function () {
        expect(function () {
            evalScheem(['/', 2]);
        }).to.throw();
    });
    test('divide too many arguments', function () {
        expect(function () {
            evalScheem(['/', 2, 3, 4]);
        }).to.throw();
    });
    test('modulus', function () {
        assert.deepEqual(
            evalScheem(['%', 7, 3]),
            1
        );
    });
    test('modulus invalid', function () {
        expect(function () {
            evalScheem(['%', 1, [2]]);
        }).to.throw();
    });
    test('modulus too few arguments', function () {
        expect(function () {
            evalScheem(['%', 2]);
        }).to.throw();
    });
    test('modulus too many arguments', function () {
        expect(function () {
            evalScheem(['%', 2, 3, 4]);
        }).to.throw();
    });
});

suite('predicates', function () {
    test('nil? nil', function () {
        assert.deepEqual(
            evalScheem(['nil?', '#nil']),
            '#t'
        );
    });
    test('nil? atom', function () {
        assert.deepEqual(
            evalScheem(['nil?', ['quote', 'a']]),
            '#f'
        );
    });
    test('nil? number', function () {
        assert.deepEqual(
            evalScheem(['nil?', 5]),
            '#f'
        );
    });
    test('nil? list', function () {
        assert.deepEqual(
            evalScheem(['nil?', ['quote', [5]]]),
            '#f'
        );
    });
    test('nil? true', function () {
        assert.deepEqual(
            evalScheem(['nil?', '#t']),
            '#f'
        );
    });
    test('nil? false', function () {
        assert.deepEqual(
            evalScheem(['nil?', '#f']),
            '#f'
        );
    });
    test('nil? too few parameters', function () {
        expect(function () {
            evalScheem(['nil?']);
        }).to.throw();
    });
    test('nil? too many parameters', function () {
        expect(function () {
            evalScheem(['nil?', 5, 6]);
        }).to.throw();
    });
    test('zero? zero', function () {
        assert.deepEqual(
            evalScheem(['zero?', 0]),
            '#t'
        );
    });
    test('zero? nonzero', function () {
        assert.deepEqual(
            evalScheem(['zero?', 5]),
            '#f'
        );
    });
    test('zero? nil', function () {
        assert.deepEqual(
            evalScheem(['zero?', '#nil']),
            '#f'
        );
    });
    test('zero? atom', function () {
        assert.deepEqual(
            evalScheem(['zero?', ['quote', 'a']]),
            '#f'
        );
    });
    test('zero? list', function () {
        assert.deepEqual(
            evalScheem(['zero?', ['quote', [5]]]),
            '#f'
        );
    });
    test('zero? true', function () {
        assert.deepEqual(
            evalScheem(['zero?', '#t']),
            '#f'
        );
    });
    test('zero? false', function () {
        assert.deepEqual(
            evalScheem(['zero?', '#f']),
            '#f'
        );
    });
    test('zero? too few parameters', function () {
        expect(function () {
            evalScheem(['zero?']);
        }).to.throw();
    });
    test('zero? too many parameters', function () {
        expect(function () {
            evalScheem(['zero?', 5, 6]);
        }).to.throw();
    });
    test('empty? empty list', function () {
        assert.deepEqual(
            evalScheem(['empty?', ['quote', []]]),
            '#t'
        );
    });
    test('empty? non empty list', function () {
        assert.deepEqual(
            evalScheem(['empty?', ['quote', [5]]]),
            '#f'
        );
    });
    test('empty? nil', function () {
        assert.deepEqual(
            evalScheem(['empty?', '#nil']),
            '#f'
        );
    });
    test('empty? atom', function () {
        assert.deepEqual(
            evalScheem(['empty?', ['quote', 'a']]),
            '#f'
        );
    });
    test('empty? number', function () {
        assert.deepEqual(
            evalScheem(['empty?', 5]),
            '#f'
        );
    });
    test('empty? true', function () {
        assert.deepEqual(
            evalScheem(['empty?', '#t']),
            '#f'
        );
    });
    test('empty? false', function () {
        assert.deepEqual(
            evalScheem(['empty?', '#f']),
            '#f'
        );
    });
    test('empty? too few parameters', function () {
        expect(function () {
            evalScheem(['empty?']);
        }).to.throw();
    });
    test('empty? too many parameters', function () {
        expect(function () {
            evalScheem(['empty?', 5, 6]);
        }).to.throw();
    });
    test('list? empty list', function () {
        assert.deepEqual(
            evalScheem(['list?', ['quote', []]]),
            '#t'
        );
    });
    test('list? non empty list', function () {
        assert.deepEqual(
            evalScheem(['list?', ['quote', [5]]]),
            '#t'
        );
    });
    test('list? nil', function () {
        assert.deepEqual(
            evalScheem(['list?', '#nil']),
            '#f'
        );
    });
    test('list? atom', function () {
        assert.deepEqual(
            evalScheem(['list?', ['quote', 'a']]),
            '#f'
        );
    });
    test('list? number', function () {
        assert.deepEqual(
            evalScheem(['list?', 5]),
            '#f'
        );
    });
    test('list? true', function () {
        assert.deepEqual(
            evalScheem(['list?', '#t']),
            '#f'
        );
    });
    test('list? false', function () {
        assert.deepEqual(
            evalScheem(['list?', '#f']),
            '#f'
        );
    });
    test('list? too few parameters', function () {
        expect(function () {
            evalScheem(['empty?']);
        }).to.throw();
    });
    test('list? too many parameters', function () {
        expect(function () {
            evalScheem(['list?', [5], 6]);
        }).to.throw();
    });
    test('atom? atom', function () {
        assert.deepEqual(
            evalScheem(['atom?', ['quote', 'a']]),
            '#t'
        );
    });
    test('atom? nil', function () {
        assert.deepEqual(
            evalScheem(['atom?', '#nil']),
            '#f'
        );
    });
    test('atom? number', function () {
        assert.deepEqual(
            evalScheem(['atom?', 5]),
            '#f'
        );
    });
    test('atom? list', function () {
        assert.deepEqual(
            evalScheem(['atom?', ['quote', [5]]]),
            '#f'
        );
    });
    test('atom? true', function () {
        assert.deepEqual(
            evalScheem(['atom?', '#t']),
            '#f'
        );
    });
    test('atom? false', function () {
        assert.deepEqual(
            evalScheem(['atom?', '#f']),
            '#f'
        );
    });
    test('atom? too few parameters', function () {
        expect(function () {
            evalScheem(['atom?']);
        }).to.throw();
    });
    test('atom? too many parameters', function () {
        expect(function () {
            evalScheem(['atom?', 'a', 2]);
        }).to.throw();
    });
    test('number? number', function () {
        assert.deepEqual(
            evalScheem(['number?', 1]),
            '#t'
        );
    });
    test('number? zero', function () {
        assert.deepEqual(
            evalScheem(['number?', 0]),
            '#t'
        );
    });
    test('number? nil', function () {
        assert.deepEqual(
            evalScheem(['number?', '#nil']),
            '#f'
        );
    });
    test('number? atom', function () {
        assert.deepEqual(
            evalScheem(['number?', ['quote', 'a']]),
            '#f'
        );
    });
    test('number? list', function () {
        assert.deepEqual(
            evalScheem(['number?', ['quote', [5]]]),
            '#f'
        );
    });
    test('number? true', function () {
        assert.deepEqual(
            evalScheem(['number?', '#t']),
            '#f'
        );
    });
    test('number? false', function () {
        assert.deepEqual(
            evalScheem(['number?', '#f']),
            '#f'
        );
    });
    test('number? too few parameters', function () {
        expect(function () {
            evalScheem(['number?']);
        }).to.throw();
    });
    test('number? too many parameters', function () {
        expect(function () {
            evalScheem(['number?', 5, 6]);
        }).to.throw();
    });
    test('bool? true', function () {
        assert.deepEqual(
            evalScheem(['bool?', '#t']),
            '#t'
        );
    });
    test('bool? false', function () {
        assert.deepEqual(
            evalScheem(['bool?', '#f']),
            '#t'
        );
    });
    test('bool? nil', function () {
        assert.deepEqual(
            evalScheem(['bool?', '#nil']),
            '#f'
        );
    });
    test('bool? atom', function () {
        assert.deepEqual(
            evalScheem(['bool?', ['quote', 'a']]),
            '#f'
        );
    });
    test('bool? number', function () {
        assert.deepEqual(
            evalScheem(['bool?', 5]),
            '#f'
        );
    });
    test('bool? list', function () {
        assert.deepEqual(
            evalScheem(['bool?', ['quote', [5]]]),
            '#f'
        );
    });
    test('bool? too few parameters', function () {
        expect(function () {
            evalScheem(['bool?']);
        }).to.throw();
    });
    test('bool? too many parameters', function () {
        expect(function () {
            evalScheem(['bool?', 'a', 2]);
        }).to.throw();
    });
});

suite('comparison', function () {
    test('equal', function () {
        assert.deepEqual(
            evalScheem(['=', 2, 2]),
            '#t'
        );
    });
    test('not equal', function () {
        assert.deepEqual(
            evalScheem(['=', 1, 2]),
            '#f'
        );
    });
    test('not-equal', function () {
        assert.deepEqual(
            evalScheem(['<>', 2, 2]),
            '#f'
        );
    });
    test('not not-equal', function () {
        assert.deepEqual(
            evalScheem(['<>', 1, 2]),
            '#t'
        );
    });
    test('less than', function () {
        assert.deepEqual(
            evalScheem(['<', 2, 3]),
            '#t'
        );
    });
    test('not less than', function () {
        assert.deepEqual(
            evalScheem(['<', 12, 3]),
            '#f'
        );
    });
    test('less than or equal to, less', function () {
        assert.deepEqual(
            evalScheem(['<=', 4, 12]),
            '#t'
        );
    });
    test('less than or equal to, equal', function () {
        assert.deepEqual(
            evalScheem(['<=', 12, 12]),
            '#t'
        );
    });
    test('not less than or equal to', function () {
        assert.deepEqual(
            evalScheem(['<=', 3, 2]),
            '#f'
        );
    });
    test('greater than', function () {
        assert.deepEqual(
            evalScheem(['>', 12, 3]),
            '#t'
        );
    });
    test('not greater than', function () {
        assert.deepEqual(
            evalScheem(['>', 2, 3]),
            '#f'
        );
    });
    test('greater than or equal to, greater', function () {
        assert.deepEqual(
            evalScheem(['>=', 12, 4]),
            '#t'
        );
    });
    test('greater than or equal to, equal', function () {
        assert.deepEqual(
            evalScheem(['>=', 12, 12]),
            '#t'
        );
    });
    test('not greater than or equal to', function () {
        assert.deepEqual(
            evalScheem(['>=', 2, 3]),
            '#f'
        );
    });
});

suite('parse', function () {
    test('alphanumeric atom', function () {
        assert.deepEqual(
            parseScheem('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
            'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        );
    });
    test('special chars atom', function () {
        assert.deepEqual(
            parseScheem('_?!+\-=@#$%^&*/.'),
            '_?!+\-=@#$%^&*/.'
        );
    });
    test('numeric atom', function () {
        assert.deepEqual(
            parseScheem('9876543210'),
            9876543210
        );
    });
    test('flat list, empty', function () {
        assert.deepEqual(
            parseScheem('()'),
            []
        );
    });
    test('flat list, one element', function () {
        assert.deepEqual(
            parseScheem('(a)'),
            ['a']
        );
    });
    test('flat list, many elements', function () {
        assert.deepEqual(
            parseScheem('(a b c)'),
            ['a', 'b', 'c']
        );
    });
    test('nested list, single element', function () {
        assert.deepEqual(
            parseScheem('(((a)))'),
            [[['a']]]
        );
    });
    test('nested list, complex', function () {
        assert.deepEqual(
            parseScheem('(a b (c d e (f g)))'),
            ['a', 'b', ['c', 'd', 'e', ['f', 'g']]]
        );
    });
    test('quote', function () {
        assert.deepEqual(
            parseScheem('\'(b d)'),
            ['quote', ['b', 'd']]
        );
    });
    test('whitespace', function () {
        assert.deepEqual(
            parseScheem('  (\n\ra\n\tb\n\t c\r)\t'),
            ['a', 'b', 'c']
        );
    });
    test('comments', function () {
        assert.deepEqual(
            parseScheem('(a b;;comment with closing parenthesis)\n)'),
            ['a', 'b']
        );
    });
});

suite('evaluation', function () {
    test('add', function () {
        assert.deepEqual(
            evalScheemString('(+ 1 2)'),
            3
        );
    });
    test('begin', function () {
        assert.deepEqual(
            evalScheemString('(begin (define x 5) (+ x 2))'),
            7
        );
    });
    test('if', function () {
        assert.deepEqual(
            evalScheemString('(if (= 3 3) \'(x y) \'(z w))'),
            ['x', 'y']
        );
    });
    test('Y combinator & factorial', function () {
        assert.deepEqual(
            evalScheemString(
            '(begin ' +
            '(define Y (lambda (f) ((lambda (x) (f (lambda (v) ((x x) v)))) (lambda (x) (f (lambda (v) ((x x) v))))))) ' +
            '(define fact (Y (lambda (f) (lambda (n) (if (= n 0) 1 (* n (f (- n 1)))))))) (fact 5))'),
            120
        );
    });
});