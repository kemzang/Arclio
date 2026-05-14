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

(* Secant method - no derivative required *)
SecantMethod[f_, x0_, x1_, tol_ : 10^-10, maxIter_ : 100] :=
  Module[
    {xPrev = x0, xCurr = x1, xNext, iter = 0},
    While[
      iter < maxIter && Abs[xCurr - xPrev] > tol,
      xNext = xCurr - f[xCurr] * (xCurr - xPrev) / (f[xCurr] - f[xPrev]);
      xPrev = xCurr;
      xCurr = xNext;
      iter++
    ];
    <|"Root" -> xCurr, "Iterations" -> iter|>
  ]

(* Test with x^3 - 2x - 5 = 0 *)
g[x_]  := x^3 - 2 x - 5
dg[x_] := 3 x^2 - 2

nrResult  = NewtonRaphson[g, dg, 2.0]
secResult = SecantMethod[g, 2.0, 3.0]

Print["Newton root:  ", nrResult["Root"]]
Print["Secant root:  ", secResult["Root"]]
Print["Agreement:    ", Abs[nrResult["Root"] - secResult["Root"]] < 10^-8]
