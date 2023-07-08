# This file was a preliminary writing of the syntax design for subscript #
# some aspects of (at least the regexes below) have changed #
# also it's not a particularly useful script #

set: x, -2;
set: y, 3.1;
call: print, x + y;
set: x.test, "test";
if: x.name = "hello";
  call: print, "hello";
end;

# ( set call if end while return ) 6 instructions #
# ( + - / * % ^ < > <= >= = != & | ) 14 operations #
# ( -?[0-9]+(.[0-9]*)? ) number #
# ( '((\\'|[^'])*)'|"((\\"|[^"])*)" ) string #
# ( `((\\`|[^`])*)` ) eval string #
# ( true|false ) boolean #
# ( [a-zA-Z_]+(\.[a-zA-Z_]+)* ) identifier #
# ( nil ) null #