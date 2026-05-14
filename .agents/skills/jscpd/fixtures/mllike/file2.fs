module DataUtils

open System
open System.Collections.Generic

let validateInput (value: string) =
    if String.IsNullOrWhiteSpace(value) then
        Error "Input cannot be empty"
    elif value.Length > 255 then
        Error "Input exceeds maximum length"
    else
        Ok value

let parseIntSafe (s: string) =
    match Int32.TryParse(s) with
    | true, v  -> Some v
    | false, _ -> None

let groupBy (keyFn: 'a -> 'b) (items: 'a list) : Map<'b, 'a list> =
    List.fold (fun acc item ->
        let key = keyFn item
        let existing = Map.tryFind key acc |> Option.defaultValue []
        Map.add key (item :: existing) acc
    ) Map.empty items

let retryAsync (maxAttempts: int) (action: unit -> Async<Result<'a, string>>) =
    async {
        let mutable attempt = 0
        let mutable result = Error "Not started"
        while attempt < maxAttempts && result = Error "Not started" do
            let! r = action()
            result <- r
            attempt <- attempt + 1
        return result
    }

// File-specific: product record type
type Product = { Id: int; Name: string; Price: float }

let createProduct id name price : Product =
    { Id = id; Name = name; Price = price }
