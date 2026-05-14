# Common Tcl utility procedures

proc validate_input {value} {
    if {$value eq ""} {
        error "Input cannot be empty"
    }
    if {[string length $value] > 255} {
        error "Input exceeds maximum length"
    }
    return [string trim $value]
}

proc parse_config {config_dict} {
    set result [dict create]
    dict set result host    [expr {[dict exists $config_dict host]    ? [dict get $config_dict host]    : "localhost"}]
    dict set result port    [expr {[dict exists $config_dict port]    ? [dict get $config_dict port]    : 3000}]
    dict set result debug   [expr {[dict exists $config_dict debug]   ? [dict get $config_dict debug]   : false}]
    dict set result timeout [expr {[dict exists $config_dict timeout] ? [dict get $config_dict timeout] : 30000}]
    return $result
}

proc retry_on_failure {max_attempts body} {
    set attempt 0
    while {$attempt < $max_attempts} {
        if {[catch {uplevel 1 $body} result]} {
            incr attempt
            if {$attempt >= $max_attempts} {
                error $result
            }
            after 1000
        } else {
            return $result
        }
    }
}

proc filter_list {lst predicate} {
    set result {}
    foreach item $lst {
        if {[uplevel 1 [list apply $predicate $item]]} {
            lappend result $item
        }
    }
    return $result
}

# File-specific: fetch products from endpoint
proc fetch_products {endpoint} {
    set token [http::geturl $endpoint]
    set data  [http::data $token]
    http::cleanup $token
    return $data
}
