/* Common SAS macros for data processing and reporting */

%macro setup_environment(dslib=WORK, logdir=%str(/tmp/logs));
    %global _run_date _run_time _env;
    %let _run_date = %sysfunc(today(), date9.);
    %let _run_time = %sysfunc(time(), time8.);
    %let _env = PRODUCTION;

    libname staging "&dslib..staging";
    libname archive "&dslib..archive";
    libname reports "&dslib..reports";

    filename logfile "&logdir./sas_&_run_date..log";
    %put NOTE: Environment initialized at &_run_date. &_run_time.;
%mend setup_environment;

%macro validate_dataset(ds=, idvar=, datevar=, required_vars=);
    %local nobs nmissing_id nmissing_date rc;

    %let rc = 0;
    proc sql noprint;
        select count(*) into :nobs trimmed
            from &ds.;
        select count(*) into :nmissing_id trimmed
            from &ds. where &idvar. is missing;
        select count(*) into :nmissing_date trimmed
            from &ds. where &datevar. is missing;
    quit;

    %if &nmissing_id. > 0 %then %do;
        %put WARNING: &nmissing_id. records have missing &idvar. in &ds.;
        %let rc = 1;
    %end;
    %if &nmissing_date. > 0 %then %do;
        %put WARNING: &nmissing_date. records have missing &datevar. in &ds.;
        %let rc = 1;
    %end;
    %put NOTE: &ds. has &nobs. total observations. Validation rc=&rc.;
    &rc.
%mend validate_dataset;

%macro compute_summary_stats(ds=, groupvar=, analysisvar=, outds=work.summary);
    proc means data=&ds. nway noprint;
        class &groupvar.;
        var &analysisvar.;
        output out=&outds.(drop=_type_ _freq_)
            n=n
            mean=mean
            std=std_dev
            min=minimum
            max=maximum
            median=median
            p25=q1
            p75=q3;
    run;
    %put NOTE: Summary statistics written to &outds.;
%mend compute_summary_stats;

/* Product analysis */
%setup_environment(dslib=WORK, logdir=%str(/tmp/logs));

data work.products;
    input prod_id $ product_name $ category $ unit_price stock_qty launch_date date9.;
    format launch_date date9.;
    datalines;
P001 WidgetA Widgets 29.99 150 01JAN2020
P002 WidgetB Widgets 39.99 230 15MAR2020
P003 GadgetX Gadgets 149.99 45 01JUN2021
P004 GadgetY Gadgets 199.99 12 20SEP2021
P005 SuperTool Tools 499.99 8 01DEC2022
;
run;

%validate_dataset(ds=work.products, idvar=prod_id, datevar=launch_date);
%compute_summary_stats(ds=work.products, groupvar=category, analysisvar=unit_price,
                       outds=work.prod_price_summary);
