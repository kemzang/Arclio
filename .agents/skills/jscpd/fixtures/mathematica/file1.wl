(* Wolfram Language - Numerical Analysis *)

(* Newton's method for root finding *)
NewtonRaphson[f_, df_, x0_, opts : OptionsPattern[]] :=
  Module[
    {x = x0, tol = 10^-10, maxIter = 100, iter = 0, history = {}},
    While[
      iter < maxIter,
      AppendTo[history, x];
      x = x - f[x] / df[x];
      iter++;
      If[Abs[f[x]] < tol, Break[]]
    ];
    <|"Root" -> x, "Iterations" -> iter, "History" -> history|>
  ]

(* Define the function and its derivative *)
f[x_]  := x^3 - 2 x - 5
df[x_] := 3 x^2 - 2

result = NewtonRaphson[f, df, 2.0]

Print["Root found: ", result["Root"]]
Print["Iterations: ", result["Iterations"]]
Print["f(root) = ", f[result["Root"]]]

(* Bisection method *)
Bisection[f_, a_, b_, tol_ : 10^-10] :=
  Module[
    {lo = a, hi = b, mid, iter = 0},
    While[
      (hi - lo) / 2 > tol,
      mid = (lo + hi) / 2;
      If[f[mid] == 0, Break[]];
      If[Sign[f[lo]] == Sign[f[mid]],
        lo = mid,
        hi = mid
      ];
      iter++
    ];
    <|"Root" -> (lo + hi) / 2, "Iterations" -> iter|>
  ]

bisResult = Bisection[f, 2, 3]
Print["Bisection root: ", bisResult["Root"]]
