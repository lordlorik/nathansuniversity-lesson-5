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
    test('a number', function () {
        assert.deepEqual(
            evalScheem(['quote', 3]),
            3
        );
    });
    test('an atom', function () {
        assert.deepEqual(
            evalScheem(['quote', 'dog']),
            'dog'
        );
    });
    test('a list', function () {
        assert.deepEqual(
            evalScheem(['quote', [1, 2, 3]]),
            [1, 2, 3]
        );
    });
    test('too many parameters', function () {
        expect(function () {
            evalScheem(['quote', [1], 2]);
        }).to.throw();
    });
});

suite('cons', function () {
    test('a number', function () {
        assert.deepEqual(
            evalScheem(['cons', 1, ['quote', [2, 3]]]),
            [1, 2, 3]
        );
    });
    test('a list', function () {
        assert.deepEqual(
            evalScheem(['cons', ['quote', [1, 2]], ['quote', [2, 3]]]),
            [[1, 2], 2, 3]
        );
    });
});

suite('car', function () {
    test('a list', function () {
        assert.deepEqual(
            evalScheem(['car', ['quote', [[2, 3], 3, 4]]]),
            [2, 3]
        );
    });
    test('a number', function () {
        assert.deepEqual(
            evalScheem(['car', ['quote', [1, 2]]]),
            1
        );
    });
    test('empty list', function () {
        expect(function () {
            evalScheem(['car', ['quote', []]]);
        }).to.throw();
    });
    test('too many parameters', function () {
        expect(function () {
            evalScheem(['car', ['quote', [1, 2]], 3]);
        }).to.throw();
    });
    test('non list', function () {
        expect(function () {
            evalScheem(['car', 1]);
        }).to.throw();
    });
});

suite('cdr', function () {
    test('a list', function () {
        assert.deepEqual(
            evalScheem(['cdr', ['quote', [1, 3, 4]]]),
            [3, 4]
        );
    });
    test('a single element list', function () {
        assert.deepEqual(
            evalScheem(['cdr', ['quote', [1]]]),
            []
        );
    });
    test('an empty list', function () {
        expect(function () {
            evalScheem(['cdr', ['quote', []]]);
        }).to.throw();
    });
    test('too many parameters', function () {
        expect(function () {
            evalScheem(['cdr', ['quote', [1, 2]], 3]);
        }).to.throw();
    });
    test('non list', function () {
        expect(function () {
            evalScheem(['cdr', 3]);
        }).to.throw();
    });
});

suite('begin', function () {
    test('a number', function () {
        assert.deepEqual(
            evalScheem(['begin', 1, 2, 3]),
            3
        );
    });
    test('an expression', function () {
        assert.deepEqual(
            evalScheem(['begin', 1, 2, ['+', 3, 4]]),
            7
        );
    });
    test('change environment', function () {
        var env = { bindings: { a: 4 } };
		
        evalScheem(['begin', ['set!', 'a', 3]], env);
        assert.deepEqual(
            env.bindings,
            { a: 3 }
        );
    });
    test('track environment', function () {
        var env = { bindings: { a: 4 } };
		
        assert.deepEqual(
			evalScheem(['begin', ['set!', 'a', 3], ['+', 'a', 2]], env),
            5
        );
    });
});

suite('if', function () {
    test('cond true, two branches', function () {
        assert.deepEqual(
            evalScheem(['if', ['=', 1, 1], 2, 3]),
            2
        );
    });
    test('cond false, two branches', function () {
        assert.deepEqual(
            evalScheem(['if', ['<>', 1, 1], 2, 3]),
            3
        );
    });
    test('cond true, one branch', function () {
        assert.deepEqual(
            evalScheem(['if', ['=', 1, 1], 2]),
            2
        );
    });
    test('cond false, one branch', function () {
        assert.deepEqual(
            evalScheem(['if', ['<>', 1, 1], 2]),
            '#f'
        );
    });
    test('cond true, no branches', function () {
        assert.deepEqual(
            evalScheem(['if', ['=', 1, 1]]),
            '#t'
        );
    });
    test('cond false, no branches', function () {
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
    test('add multiple', function () {
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
    test('subtract', function () {
        assert.deepEqual(
            evalScheem(['-', 1, 2]),
            -1 
        );
    });
    test('substract invalid', function () {
        expect(function () {
            evalScheem(['-', 1, [2]]);
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
    test('multiply single', function () {
        assert.deepEqual(
            evalScheem(['*', 3]),
            3
        );
    });
    test('multiply multiple', function () {
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
});

suite('predicates', function () {
    test('nil? nil', function () {
        assert.deepEqual(
            evalScheem(['nil?', 'nil']),
            '#t'
        );
    });
    test('nil? not nil', function () {
        assert.deepEqual(
            evalScheem(['nil?', 5]),
            '#f'
        );
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
    test('empty? not empty', function () {
        assert.deepEqual(
            evalScheem(['empty?', ['quote', [5]]]),
            '#f'
        );
    });
    test('empty? not list', function () {
        assert.deepEqual(
            evalScheem(['empty?', 5]),
            '#f'
        );
    });
    test('empty? too many parameters', function () {
        expect(function () {
            evalScheem(['empty?', 5, 6]);
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