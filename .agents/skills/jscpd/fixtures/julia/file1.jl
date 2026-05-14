"""
Common mathematical utility functions.
"""

function compute_statistics(data::Vector{Float64})
    n = length(data)
    mean_val = sum(data) / n
    variance = sum((x - mean_val)^2 for x in data) / n
    std_dev = sqrt(variance)
    return (mean=mean_val, std=std_dev, n=n)
end

function normalize_vector(v::Vector{Float64})
    min_v = minimum(v)
    max_v = maximum(v)
    range = max_v - min_v
    if range == 0.0
        return zeros(length(v))
    end
    return (v .- min_v) ./ range
end

function moving_average(data::Vector{Float64}, window::Int)
    n = length(data)
    result = zeros(n - window + 1)
    for i in 1:(n - window + 1)
        result[i] = sum(data[i:i+window-1]) / window
    end
    return result
end

# File-specific: linear regression
function linear_regression(x::Vector{Float64}, y::Vector{Float64})
    n = length(x)
    slope = (n * sum(x .* y) - sum(x) * sum(y)) / (n * sum(x .^ 2) - sum(x)^2)
    intercept = (sum(y) - slope * sum(x)) / n
    return (slope=slope, intercept=intercept)
end
