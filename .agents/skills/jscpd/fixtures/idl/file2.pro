% Common utility predicates

validate_input(Value, ok) :-
    atom(Value),
    atom_length(Value, Len),
    Len > 0,
    Len =< 255.
validate_input(_, error("Invalid input")).

parse_int(Str, Int) :-
    atom_codes(Str, Codes),
    number_codes(Int, Codes).

list_sum([], 0).
list_sum([H|T], Sum) :-
    list_sum(T, Rest),
    Sum is H + Rest.

list_max([X], X).
list_max([H|T], Max) :-
    list_max(T, TMax),
    (H > TMax -> Max = H ; Max = TMax).

member_check(Elem, [Elem|_]).
member_check(Elem, [_|T]) :-
    member_check(Elem, T).

% File-specific: list minimum
list_min([X], X).
list_min([H|T], Min) :-
    list_min(T, TMin),
    (H < TMin -> Min = H ; Min = TMin).
