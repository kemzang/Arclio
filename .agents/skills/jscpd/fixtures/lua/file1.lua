-- Common Lua utility functions

local M = {}

function M.validate_input(value)
    if not value or value == "" then
        return nil, "Input cannot be empty"
    end
    if #value > 255 then
        return nil, "Input exceeds maximum length"
    end
    return value, nil
end

function M.table_contains(tbl, element)
    for _, v in ipairs(tbl) do
        if v == element then return true end
    end
    return false
end

function M.map(tbl, fn)
    local result = {}
    for i, v in ipairs(tbl) do
        result[i] = fn(v)
    end
    return result
end

function M.filter(tbl, predicate)
    local result = {}
    for _, v in ipairs(tbl) do
        if predicate(v) then
            result[#result + 1] = v
        end
    end
    return result
end

function M.reduce(tbl, fn, init)
    local acc = init
    for _, v in ipairs(tbl) do
        acc = fn(acc, v)
    end
    return acc
end

-- File-specific: sum a table
function M.sum(tbl)
    return M.reduce(tbl, function(a, b) return a + b end, 0)
end

return M
