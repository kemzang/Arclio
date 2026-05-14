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

/* Employee analysis */
%setup_environment(dslib=WORK, logdir=%str(/tmp/logs));

data work.employees;
    input emp_id $ first_name $ last_name $ department $ salary hire_date date9.;
    format hire_date date9.;
    datalines;
E001 Alice Smith Engineering 95000 01JAN2019
E002 Bob Jones Engineering 88000 15MAR2021
E003 Carol White Marketing 72000 01JUN2017
E004 Dave Brown Finance 81000 20SEP2022
E005 Eve Davis Engineering 101000 01DEC2018
;
run;

%validate_dataset(ds=work.employees, idvar=emp_id, datevar=hire_date);
%compute_summary_stats(ds=work.employees, groupvar=department, analysisvar=salary,
                       outds=work.emp_salary_summary);
