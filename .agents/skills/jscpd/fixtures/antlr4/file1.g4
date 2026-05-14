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
MUL     : '*' ;
DIV     : '/' ;
ADD     : '+' ;
SUB     : '-' ;
