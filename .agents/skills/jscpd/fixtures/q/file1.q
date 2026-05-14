/ Common utility functions for kdb+/q analytics platform

/ String utilities
.util.trim:{x where not null x};
.util.ltrim:{x where (x=" ")&not mins x=" "};
.util.rtrim:{reverse .util.ltrim reverse x};
.util.strip:{.util.ltrim .util.rtrim x};
.util.upper:{`$upper string x};
.util.lower:{`$lower string x};
.util.pad:{[n;x] (n#" "),-n#(string x),n#" "};

/ Numeric utilities
.util.nullToZero:{0^x};
.util.pct:{[x;y] 100*x%y};
.util.round:{[n;x] (floor 0.5+x*10 xexp n)%10 xexp n};
.util.clip:{[lo;hi;x] lo|hi&x};
.util.zscore:{[x] (x-avg x)%dev x};
.util.movAvg:{[n;x] sums[x]%til[count x]+1};
.util.cumSum:{sums x};
.util.cumMax:{maxs x};

/ Date utilities
.util.today:{`date$now[]};
.util.yesterday:{`date$now[]-1};
.util.startOfMonth:{`month$x};
.util.endOfMonth:{(`month$x+31)-1};
.util.isWeekend:{d:x mod 7; d in 5 6};
.util.businessDays:{x where not .util.isWeekend x};

/ Employee data processing
emp:([] id:`e001`e002`e003`e004`e005;
        name:`Alice`Bob`Carol`Dave`Eve;
        dept:`Engineering`Engineering`Marketing`Finance`Engineering;
        salary:95000 88000 72000 81000 101000;
        hired:.z.d-365*5 3 7 2 4);

.emp.byDept:{select count i, avg salary by dept from emp};
.emp.topEarners:{[n] n sublist `salary xdesc emp};
.emp.inDept:{[d] select from emp where dept=d};
