let Subscript = {
  // Splits a string by a single unescaped delimeter.
  // e.g. 'one "two" three' => ['one', '"two"', 'three']
  _split: function(stmnt, chr = "`") {
    // stringlike splitting
    let result = [];
    let prev = '';
    let active = 1;
    let start = 0;
    for (let i = 0; i < stmnt.length; i++) {
      let c = stmnt.charAt(i);
      if (c == chr && prev != '\\') {
        active = 1 - active;
        result.push(stmnt.substring(start, i + active));
        start = i + active;
      }
      prev = c;
    }
    result.push(stmnt.substring(start));
    return result;
  },
  // Rejoins a split string together, splitting on ':' or ',' while keeping strings intact
  // e.g. ['call:print,', '"one:two,"', '+', '"three,four"'] => ['call', 'print', '"one:two"', '+', '"three,four"']
  _join: function(a) {
    let result = []
    let rtmp = []
    let tmp = ""
    for (let i = 0; i < a.length; i++) {
      let b = a[i];
      if (b.charAt(0) == '`' || b.charAt(0) == '"') {
        tmp += b;
        continue
      }
      for (let j = 0; j < b.length; j++) {
        let k = b.charAt(j);
        if (k == ':' || k == ',') {
          rtmp.push(tmp.trim());
          tmp = "";
        } else if (k == ';') {
          rtmp.push(tmp.trim())
          tmp = "";
          result.push(rtmp);
          rtmp = [];
        } else {
          tmp += k;
        }
      }
    }
    rtmp.push(tmp.trim());
    result.push(rtmp);
    return result.filter(x => x.length > 0);
  },
  // Returns the precedence level of the given operator
  _precedence: function(op) {
    switch (op) {
      case '!':
      case 'neg':
        return 100;
      case '^':
        return 7;
      case '*':
      case '/':
      case '%':
        return 6;
      case '+':
      case '-':
        return 5;
      case '>':
      case '<':
      case '>=':
      case '<=':
        return 4;
      case '=':
      case '==':
      case '!=':
        return 3;
      case '&':
      case '&&':
       return 2;
      case '|':
      case '||':
        return 1;
      case '(':
        return -1;
      case undefined:
        break;
      default:
        console.error(`Unable to determine precedence for operator ${op}`);
    }
  },
  // Applies the top operator from the operator stack to the values on the top of the output stack
  _apply: function(out, ops) {
    let op = ops.pop();
    if (op == '(') {
      console.error("Unmatched parenthesis found");
    }
    let b = out.pop();
    let a = null;
    if (op != '!' && op != 'neg') {
      a = out.pop();
    }
    if (a === undefined || b === undefined) {
      console.error(`Not enough parameters for ${op} operation: found (${a}, ${b})`);
    }
    switch (op) {
      case '+':
        out.push(a + b);
        break;
      case '-':
        out.push(a - b);
        break;
      case '*':
        out.push(a * b);
        break;
      case '/':
        out.push(a / b);
        break;
      case '%':
        out.push(a % b);
        break;
      case '^':
        out.push(a ** b);
        break;
      case '<':
        out.push(a < b);
        break;
      case '>':
        out.push(a > b);
        break;
      case '<=':
        out.push(a <= b);
        break;
      case '>=':
        out.push(a >= b);
        break;
      case '=':
      case '==':
        out.push(a == b);
        break;
      case '!=':
        out.push(a != b);
        break;
      case '&':
      case '&&':
        out.push(a && b);
        break;
      case '|':
      case '||':
        out.push(a || b);
        break;
      case '!':
        console.log(`evaluating !${b}`);
        out.push(!b);
        break;
      case 'neg':
        console.log(`evaluating -${b}`);
        out.push(-b);
        break;
      default:
        console.error(`Error: Unknown operator ${op}(${a}, ${b})`);
    }
  },
  // Evaluates a value
  _eval: function(rvalue, scope) {
    let output = [];
    let operator = [];
    let unary = true;
    for (let i = 0; i < rvalue.length; i++) {
      let chr = rvalue.charAt(i);
      let j = i + 1;
      switch (true) {
        case (/\s/).test(chr):
          break;
        case (/"/).test(chr):
          // String
          while ((rvalue.charAt(j) != '"' || rvalue.charAt(j - 1) == '\\') && j < rvalue.length) {
            j += 1;
          }
          if (j >= rvalue.length) {
            console.error(`Unterminated string in expression ${rvalue}`);
            return null;
          }
          output.push(rvalue.substring(i + 1, j).replaceAll('\\"', '"'));
          i = j;
          unary = false;
          break;
        case (/`/).test(chr):
          // Evalstring
          while ((rvalue.charAt(j) != '`' || rvalue.charAt(j - 1) == '\\') && j < rvalue.length) {
            j += 1;
          }
          if (j >= rvalue.length) {
            console.error(`Unterminated evalstring in expression ${rvalue}`);
            return null;
          }
          output.push(Subscript.parse(rvalue.substring(i + 1, j).replaceAll('\\`', '`'), scope));
          i = j;
          unary = false;
          break;
        case (/[0-9]/).test(chr):
          // Number
          while (/[0-9.]/.test(rvalue.charAt(j)) && j < rvalue.length) {
            j += 1;
          }
          output.push(Number(rvalue.substring(i, j)));
          i = j - 1;
          unary = false;
          break;
        case (/[a-zA-Z_]/).test(chr):
          // identifier (incl. true/false/null/nil)
          while (/[a-zA-Z\._0-9]/.test(rvalue.charAt(j)) && j < rvalue.length) {
            j += 1;
          }
          let split = rvalue.substring(i, j).split('.');
          i = j - 1;
          if (split.length == 1) {
            if (split[0] == 'true') {
              output.push(true);
              break;
            } else if (split[0] == 'false') {
              output.push(false);
              break;
            } else if (split[0] == 'null' || split[0] == 'nil') {
              output.push(null);
              break;
            }
          }
          let result = scope;
          for (k of split) {
            if (result[k] == undefined) {
              console.error(`No such property ${k} in identifier ${split.join('.')}`);
            }
            if (result != undefined) {
              result = result[k];
            }
          }
          output.push(result);
          unary = false;
          break;
        default:
          switch (chr) {
            case '.':
              if (unary && /[0-9]/.test(rvalue.charAt(j))) {
                while (/[0-9.]/.test(rvalue.charAt(j)) && j < rvalue.length) {
                  j += 1;
                }
                output.push(Number(rvalue.substring(i, j)));
              } else {
                while (/[a-zA-Z\._0-9]/.test(rvalue.charAt(j)) && j < rvalue.length) {
                  j += 1;
                }
                let split = rvalue.substr(1).substring(i, j).split('.');
                let result = output.pop();
                let tmp = result;
                for (k of split) {
                  if (result[k] == undefined) {
                    console.error(`No such property ${k} in ${tmp}.${split.join('.')}`);
                  }
                  if (result != undefined) {
                    result = result[k]
                  }
                }
                output.push(result);
              }
              i = j - 1;
              unary = false;
              break;
            case '<':
            case '>':
            case '!':
            case '=':
              if (rvalue.charAt(i + 1) == '=') {
                let op = chr+'=';
                while (Subscript._precedence(operator[operator.length-1]) >= Subscript._precedence(op)) {
                  Subscript._apply(output, operator);
                }
                operator.push(op);
                i += 1;
                unary = true;
                break;
              }
            case '&':
            case '|':
              if (rvalue.charAt(i + 1) == chr) {
                let op = chr + chr;
                while (Subscript._precedence(operator[operator.length-1]) >= Subscript._precedence(op)) {
                  Subscript._apply(output, operator);
                }
                operator.push(op);
                i += 1;
                break;
              }
            case '(':
              operator.push(chr);
              unary = true;
              break;
            case '*':
            case '/':
            case '%':
            case '+':
              while (Subscript._precedence(operator[operator.length-1]) >= Subscript._precedence(chr)) {
                Subscript._apply(output, operator);
              }
              operator.push(chr);
              unary = true;
              break;
            case '^':
              while (Subscript._precedence(operator[operator.length-1]) > Subscript._precedence(chr)) {
                Subscript._apply(output, operator);
              }
              operator.push(chr);
              unary = true;
              break;
            case ')':
              while (operator[operator.length - 1] != '(') {
                Subscript._apply(output, operator);
                if (operator[operator.length - 1] == '(') {
                  break;
                }
                if (operator.length <= 0) {
                  console.error(`Unmatched parentheses in statement ${rvalue}`);
                  break;
                }
              }
              operator.pop();
              unary = true;
              break;
            case '-':
              if (unary) {
                while (Subscript._precedence(operator[operator.length-1]) >= Subscript._precedence('neg')) {
                  Subscript._apply(output, operator);
                }
                operator.push('neg');
                unary = false;
              } else {
                while (Subscript._precedence(operator[operator.length-1]) >= Subscript._precedence(chr)) {
                  Subscript._apply(output, operator);
                }
                operator.push(chr);
                unary = true;
              }
              break;
          }
      }
    }
    // So commonly needed that I'm not even going to remove the lines
    // console.debug("Evaluating:")
    // console.debug(output);
    // console.debug(operator);
    while (operator.length > 0) {
      Subscript._apply(output, operator);
    }
    if (output.length != 1) {
      console.error(`Error: expression '${rvalue}' contains too many output values. Are you missing an operator?`);
    }
    return output.pop();
  },
  _set: function(lvalue, rvalue, scope) {
    value = scope;
    split = lvalue.split('.');
    for (let i = 0; i < split.length - 1; i++) {
      value = value[split[i]];
      if (value == undefined) {
        console.error(`Error: value ${split.slice(0, i + 1).join('')} is undefined`)
        return;
      }
    }
    value[split[split.length - 1]] = rvalue;
  },
  parse: function(code, scope={'print':console.log}) {
    let execute = 0;
    let jumps = [];
    let a = Subscript._split(code, '#').filter(x => x.charAt(0) != '#').join('');
    a = Subscript._split(a, '`');
    a = a.map(x => ((x.charAt(0) != '`')? Subscript._split(x, '"') : x)).flat();
    a = Subscript._join(a).filter(x => x != "");
    let parts = a.map(x => `${x[0]}: ${x.slice(1).join(', ')}`);
    let tmp = null;
    for (let i = 0; i < parts.length; i++) {
      let instruction = a[i][0];
      let args = a[i].slice(1);
      if (execute > 0) {
        switch (instruction) {
          case "end":
            execute -= 1;
            break;
          case "if":
          case "while":
            execute += 1;
        }
        continue;
      }
      let lvalue = undefined;
      let rvalue = undefined;
      switch (instruction) {
        case 'set': // lvalue rvalue
          if (args.length != 2) {
            console.error(`Error in statement ${i} (${parts[i]}): Required 2 arguments, found ${args.length}`);
            return null;
          }
          lvalue = args[0];
          rvalue = Subscript._eval(args[1], scope);
          tmp = rvalue;
          Subscript._set(lvalue, rvalue, scope);
          break;
        case 'call': // lvalue rvalue*
          if (args.length < 1) {
            console.error(`Error in statement ${i} (${parts[i]}): Required at least one argument, found ${args.length}`);
            return null;
          }
          lvalue = Subscript._eval(args[0], scope);
          let rletgs = [];
          for (let j = 1; j < args.length; j++) {
            rletgs.push(Subscript._eval(args[j], scope));
          }
          try {
            tmp = (lvalue)(...rletgs);
          } catch (e) {
            console.error(`Error in statement ${i} (${parts[i]}): ${e}`);
            return null;
          }
          break;
        case 'if': // rvalue
          if (args.length == 2) {
            if (Subscript._eval(args[0], scope)) {
              tmp = Subscript._eval(args[1], scope);
            }
          } else if (args.length != 1) {
            console.error(`Error in statement ${i} (${parts[i]}): Required 1 argument, found ${args.length}`);
            return null;
          } else {
            rvalue = Subscript._eval(args[0], scope);
            if (!rvalue) {
              execute += 1;
            } else {
              jumps.push(-1);
            }
          }
          break;
        case 'end': // nothing
          if (args.length != 0) {
            console.error(`Error in statement ${i} (${parts[i]}): Required 0 arguments, found ${args.length}`);
            return null;
          }
          let ret = jumps.pop();
          if (ret != -1) {
            i = ret - 1;
          }
          break;
        case 'while': // rvalue
          if (args.length == 2) {
           while(Subscript._eval(args[0], scope)) {
              tmp = Subscript._eval(args[1], scope);
            } 
          } else if (args.length != 1) {
            console.error(`Error in statement ${i} (${parts[i]}): Required 1 argument, found ${args.length}`);
            return null;
          } else {
            rvalue = Subscript._eval(args[0], scope);
            if (!rvalue) {
              execute += 1;
            } else {
              jumps.push(i);
            }
          }
          break;
        case 'return': // rvalue
          if (args.length != 1) {
            console.error(`Error in statement ${i} (${parts[i]}): Required 1 argument, found ${args.length}`);
            return null;
          }
          rvalue = Subscript._eval(args[0], scope);
          return rvalue;
        default:
          console.error(`Unknown instruction ${instruction} in statement ${i} (${parts[i]})`);
          console.error("Did you forget the instruction format? (op:arg,arg;)");
          console.debug(parts);
      }
    }
    return tmp;
  }
}
