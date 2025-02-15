// extend imports as needed
import {
    parse
} from 'sicp';
import {
    type Environment,
    setup_environment,
    evaluate,
    tagged_list_to_record
} from '../src/mce';


// write your tests here

describe(evaluate, (): void => {
    let env: Environment;

    beforeEach((): void => {
        env = setup_environment();
    });

    test("case literals", (): void => {
        expect(evaluate(tagged_list_to_record(parse("10;")), env)).toBe(10);
        expect(evaluate(tagged_list_to_record(parse("true;")), env)).toBe(true);
        expect(evaluate(tagged_list_to_record(parse("'Hello, World!';")), env)).toBe("Hello, World!");
        expect(evaluate(tagged_list_to_record(parse("math_PI;")), env)).toBe(Math.PI);
    });

    test("case conditionals", (): void => {
        expect(evaluate(tagged_list_to_record(parse("true ? 1 : 0;")), env)).toBe(1);
        expect(evaluate(tagged_list_to_record(parse("false ? 1 : 0;")), env)).toBe(0);
        expect(evaluate(tagged_list_to_record(parse("1 > 0 ? 'yes' : 'no';")), env)).toBe("yes");
        expect(evaluate(tagged_list_to_record(parse("1 < 0 ? 'yes' : 'no';")), env)).toBe("no");
    });

    test("case applications, functions", (): void => {
        expect(evaluate(tagged_list_to_record(parse("math_abs(-10);")), env)).toBe(10);

        const code: string = "{ const mul = (a, b) => a * b; mul(3, 5); }";
        expect(evaluate(tagged_list_to_record(parse(code)), env)).toBe(15);
    });

    test("case operator combinations", (): void => {
        expect(evaluate(tagged_list_to_record(parse("(20 + 5 * 3 - 3) / 2;")), env)).toBe(16);
        expect(evaluate(tagged_list_to_record(parse("!!true;")), env)).toBe(true);
    });

    test("case names, declarations, assignment, block", (): void => {
        expect(evaluate(tagged_list_to_record(parse("{ const x = 10; x = x + 5; x; }")), env)).toBe(15);
        expect(evaluate(tagged_list_to_record(parse("{ const x = 5; const y = 10; const z = 3; x + y - z; }")), env)).toBe(12);
    });
});
