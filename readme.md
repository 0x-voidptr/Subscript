## Subscript
### A small scripting language
Currently in javascript, other implementations tbd

---

#### The gist:
I wanted to run user code but eval() is unsafe.
Hence, a small language where user-provided code is relatively safe.
(Even if the syntax is clunky as hell)

This language is, in it's current state, absolutely ***not*** portable.
It is a thin wrapper over the behaviours of javascript and any further implementations
will need to address that if they wish to be cross-compatible.
But as a bare-bones scripting language for single-platform applications it is, maybe tolerable.

#### Usage:
Each statement consists of an instruction separated from the arguments by a colon,
then the arguments separated by commas.
Statements are separated by semicolons.

There are 6 instructions:
* set: a, b; - assigns the variable a the value of b. a must be an identifier,
while b can be any value.
* call: a, ...; - calls the function stored in variable a with the arguments provided after.
* if: a[, b]; - if a is truthy, evaluate b (if available). If b is not provided,
execution will continue until an end instruction is found.
* end; - ends the current conditional block.
* while: a[, b]; - while a is truthy, evaluate b (if available). If b is not provided,
execution will continue until an end instruction is found.
* return a; - returns the provided value, ending execution.

There are 4 types of literal values:
* Strings ( "Hello" ) - A literal string value
* Numbers ( 0.2 ) - A literal number value
* Identifiers ( test ) - Refers to a variable in the scope
 * true, false, null, and nil are special cases of variables that evaluate to what you'd expect.
 * (note: `true` evaluates to the value true, `true.something` attempts to read the variable named true)
* Eval Strings ( `call: print, "Hello!"` ) - Evaluate the contents as their own script

There are several operators:
* a ^ b - power
* a % b - modulus
* a * b - multiply
* a / b - divide
* a + b - plus
* a - b - minus
* a > b - greater than
* a >= b - greater or equal to
* a < b - less than
* a <= b - less or equal to
* a & b or a && b - and
* a | b or a || b - or
* a = b or a == b - equal
* a != b - not equal

And a couple of unary operators that I hope work because I just sorta hacked them into the shunting yard algorithm:
* -a - arithmetical negation
* !a - logical negation
