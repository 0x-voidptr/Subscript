set: i, 0;
while: i < 100;
  set: out, "";
  set: i, i + 1;
  if: i % 3 == 0;
   set: out, "Fizz";
  end;
  if: i % 5 == 0;
    set: out, out + "Buzz";
  end;
  if: out.length == 0, `set: out, i`;
  call: print, out;
end
