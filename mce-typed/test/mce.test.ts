// extend imports as needed
import {
    parse
} from 'sicp';
import {
    type Environment,
    setup_environment,
    evaluate,
} from '../src/mce';


// write your tests here

describe(evaluate, (): void => {
    let env: Environment;

    beforeEach((): void => {
        env = setup_environment();
    });

    test("case literals", (): void => {
        expect(evaluate(parse("10;"), env)).toBe(10);
        expect(evaluate(parse("true;"), env)).toBe(true);
        expect(evaluate(parse("'Hello, World!';"), env)).toBe("Hello, World!");
        expect(evaluate(parse("math_PI;"), env)).toBe(Math.PI);
    });

    test("case conditionals", (): void => {
        expect(evaluate(parse("true ? 1 : 0;"), env)).toBe(1);
        expect(evaluate(parse("false ? 1 : 0;"), env)).toBe(0);
        expect(evaluate(parse("1 > 0 ? 'yes' : 'no';"), env)).toBe("yes");
        expect(evaluate(parse("1 < 0 ? 'yes' : 'no';"), env)).toBe("no");
    });

    test("case applications, functions", (): void => {
        expect(evaluate(parse("math_abs(-10);"), env)).toBe(10);

        const code: string = "{ const mul = (a, b) => a * b; mul(3, 5); }";
        expect(evaluate(parse(code), env)).toBe(15);
    });

    test("case operator combinations", (): void => {
        expect(evaluate(parse("(20 + 5 * 3 - 3) / 2;"), env)).toBe(16);
        expect(evaluate(parse("!!true;"), env)).toBe(true);
    });

    test("case names, declarations, assignments, blocks", (): void => {
        expect(evaluate(parse("{ const x = 10; x = x + 5; x; }"), env)).toBe(15);
        expect(evaluate(parse("{ const x = 5; const y = 10; const z = 3; x + y - z; }"), env)).toBe(12);
    });
});

// npx jest --collectCoverage --coverageReporters=text
