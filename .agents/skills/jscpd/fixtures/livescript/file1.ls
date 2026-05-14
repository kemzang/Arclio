processItems = (items) ->
  items
    .filter (item) -> item.active
    .map (item) ->
      id:    item.id
      name:  item.name.toUpperCase()
      value: item.value * 2

validateInput = (value) ->
  return Error "Input cannot be empty"    if not value
  return Error "Input too long"           if value.length > 255
  return Ok value

fetchData = (url, options = {}) ->
  defaults =
    timeout:     30000
    retries:     3
    contentType: 'application/json'
  config = Object.assign {}, defaults, options
  fetch url, config

retryOnFailure = (maxAttempts, fn) ->
  attempt = 0
  loop
    try
      return fn()
    catch err
      attempt++
      throw err if attempt >= maxAttempts

# File-specific: format users list
formatUsers = (users) ->
  processItems users |> (items) ->
    items.map (u) -> "#{u.id}: #{u.name}"
