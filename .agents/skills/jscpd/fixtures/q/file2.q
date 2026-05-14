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

/ Product data processing
prod:([] id:`p001`p002`p003`p004`p005;
         name:`WidgetA`WidgetB`GadgetX`GadgetY`SuperTool;
         category:`Widgets`Widgets`Gadgets`Gadgets`Tools;
         price:29.99 39.99 149.99 199.99 499.99;
         stock:150 230 45 12 8);

.prod.byCategory:{select count i, avg price by category from prod};
.prod.topPriced:{[n] n sublist `price xdesc prod};
.prod.inCategory:{[c] select from prod where category=c};
