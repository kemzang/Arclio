#!/usr/bin/awk -f
# AWK script to process CSV data and compute statistics

BEGIN {
    FS = ",";
    OFS = "\t";
    total = 0;
    count = 0;
    print "Processing records...";
    print "Name\tValue\tRunning Total";
}

NR > 1 {
    name = $1;
    value = $2;
    total += value;
    count++;
    printf "%-20s\t%8.2f\t%10.2f\n", name, value, total;
}

END {
    if (count > 0) {
        average = total / count;
        printf "\nSummary:\n";
        printf "  Records: %d\n", count;
        printf "  Total:   %.2f\n", total;
        printf "  Average: %.2f\n", average;
    } else {
        print "No records found.";
    }
}
