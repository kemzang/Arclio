functor (Arg : sig type t end) =>
struct

  fun validate_input value =
    if String.size value = 0 then
      Error "Input cannot be empty"
    else if String.size value > 255 then
      Error "Input exceeds maximum length"
    else
      Ok value

  fun parse_int s =
    case Int.fromString s of
      SOME n => SOME n
    | NONE   => NONE

  fun group_by key_fn items =
    List.foldl (fn (item, acc) =>
      let val key = key_fn item in
        (key, item) :: acc
      end
    ) [] items

  (* File-specific: filter active items *)
  fun filter_active items =
    List.filter (fn item => #active item) items

end
