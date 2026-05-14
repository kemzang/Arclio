grammar Calculator;

prog
    : stat+ EOF
    ;

stat
    : expr NEWLINE
    | NEWLINE
    ;

expr
    : expr op=('*' | '/') expr    # MulDiv
    | expr op=('+' | '-') expr    # AddSub
    | INT                          # Int
    | '(' expr ')'                 # Parens
    ;

NEWLINE : [\r\n]+ ;
INT     : [0-9]+ ;
WS      : [ \t]+ -> skip ;
FLOAT   : [0-9]+ '.' [0-9]* ;
ID      : [a-zA-Z_][a-zA-Z_0-9]* ;
