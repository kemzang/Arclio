let validate_input value =
  if String.length value = 0 then
    Error "Input cannot be empty"
  else if String.length value > 255 then
    Error "Input exceeds maximum length"
  else
    Ok value

let parse_int_safe s =
  try Some (int_of_string s)
  with Failure _ -> None

let group_by key_fn items =
  List.fold_left (fun acc item ->
    let key = key_fn item in
    let existing = try List.assoc key acc with Not_found -> [] in
    (key, item :: existing) :: List.remove_assoc key acc
  ) [] items

let retry max_attempts action =
  let rec loop attempt =
    if attempt >= max_attempts then Error "Max retries exceeded"
    else
      match action () with
      | Ok v    -> Ok v
      | Error _ -> loop (attempt + 1)
  in
  loop 0

(* File-specific: product type *)
type product = { id: int; name: string; price: float }

let make_product id name price = { id; name; price }
