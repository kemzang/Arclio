#!/bin/bash

# Common utility functions
log_message() {
    local level="$1"
    local message="$2"
    echo "[$(date +%Y-%m-%d\ %H:%M:%S)] [$level] $message"
}

check_root() {
    if [ "$(id -u)" -ne 0 ]; then
        log_message "ERROR" "This script must be run as root"
        exit 1
    fi
}

setup_directories() {
    local base_dir="$1"
    mkdir -p "$base_dir/logs"
    mkdir -p "$base_dir/tmp"
    mkdir -p "$base_dir/config"
    log_message "INFO" "Created directory structure under $base_dir"
}

validate_input() {
    local input="$1"
    if [ -z "$input" ]; then
        log_message "ERROR" "Input cannot be empty"
        return 1
    fi
    return 0
}

# Script-specific: start service
start_service() {
    local service="$1"
    systemctl start "$service"
    log_message "INFO" "Started $service"
}
