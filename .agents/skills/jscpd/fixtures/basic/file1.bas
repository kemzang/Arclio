10 REM Basic Program for grade calculation
20 DIM scores(10)
30 DIM names$(10)
40 count = 0
50 FOR i = 1 TO 10
60   INPUT "Enter student name: ", names$(i)
70   INPUT "Enter score (0-100): ", scores(i)
80   count = count + 1
90 NEXT i
100 total = 0
110 FOR i = 1 TO count
120   total = total + scores(i)
130 NEXT i
140 average = total / count
150 PRINT "Class Statistics:"
160 PRINT "Total students: "; count
170 PRINT "Average score: "; average
180 FOR i = 1 TO count
190   IF scores(i) >= 90 THEN PRINT names$(i); " - Grade: A"
200   IF scores(i) >= 80 AND scores(i) < 90 THEN PRINT names$(i); " - Grade: B"
210   IF scores(i) >= 70 AND scores(i) < 80 THEN PRINT names$(i); " - Grade: C"
220   IF scores(i) < 70 THEN PRINT names$(i); " - Grade: F"
230 NEXT i
240 END
