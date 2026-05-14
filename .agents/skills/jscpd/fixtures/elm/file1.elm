module Main exposing (main)

import Html exposing (Html, div, h1, p, text, button)
import Html.Attributes exposing (class, id)
import Html.Events exposing (onClick)
import Browser


type alias Model =
    { count : Int
    , message : String
    , isLoading : Bool
    }


initialModel : Model
initialModel =
    { count = 0
    , message = "Welcome"
    , isLoading = False
    }


type Msg
    = Increment
    | Decrement
    | Reset


update : Msg -> Model -> Model
update msg model =
    case msg of
        Increment ->
            { model | count = model.count + 1 }

        Decrement ->
            { model | count = model.count - 1 }

        Reset ->
            initialModel


-- App-specific view
view : Model -> Html Msg
view model =
    div [ class "app" ]
        [ h1 [] [ text "Counter App" ]
        , p [] [ text (String.fromInt model.count) ]
        , button [ onClick Increment ] [ text "+" ]
        ]


main : Program () Model Msg
main =
    Browser.sandbox { init = initialModel, update = update, view = view }
