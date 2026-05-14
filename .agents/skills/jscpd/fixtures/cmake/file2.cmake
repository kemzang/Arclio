cmake_minimum_required(VERSION 3.16)
project(MyProject VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

function(add_common_flags target)
    target_compile_options(${target} PRIVATE
        -Wall -Wextra -Wpedantic -Werror
        $<$<CONFIG:Debug>:-g -O0>
        $<$<CONFIG:Release>:-O3>
    )
    target_include_directories(${target} PRIVATE ${CMAKE_SOURCE_DIR}/include)
endfunction()

function(configure_tests target)
    enable_testing()
    add_test(NAME ${target}_tests COMMAND ${target})
    set_tests_properties(${target}_tests PROPERTIES TIMEOUT 60)
endfunction()

# Library-specific: add shared library
add_library(mylib SHARED src/lib.cpp src/utils.cpp)
add_common_flags(mylib)
set_target_properties(mylib PROPERTIES VERSION 1.0.0 SOVERSION 1)
