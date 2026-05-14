functor Make (Ord : ORD) = struct
  type elem = Ord.t

  val validate_input : string -> (string, string) result
  fun validate_input value =
    if String.size value = 0 then
      Error "Input cannot be empty"
    else if String.size value > 255 then
      Error "Input exceeds maximum length"
    else
      Ok value

  val parse_int : string -> int option
  fun parse_int s =
    (case Int.fromString s of
       SOME n => SOME n
     | NONE   => NONE)

  fun group_by key_fn items =
    List.foldl (fn (item, acc) =>
      let val key = key_fn item
          val existing = case List.find (fn (k, _) => k = key) acc of
                           SOME (_, v) => v
                         | NONE => []
      in (key, item :: existing) :: List.filter (fn (k, _) => k <> key) acc
      end
    ) [] items

  (* File-specific: product of a list *)
  fun product_list lst =
    List.foldl (fn (x, acc) => x * acc) 1 lst
end
