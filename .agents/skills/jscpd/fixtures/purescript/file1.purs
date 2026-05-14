module Main where

import Prelude
import Data.Maybe (Maybe(..), fromMaybe)
import Data.Array (filter, map, foldl, length, sortBy)
import Data.String (toLower, trim)
import Data.Ord (comparing)

-- Data types
type StudentId = Int

type Student =
  { id :: StudentId
  , name :: String
  , grades :: Array Number
  , major :: String
  }

-- Calculate grade average
average :: Array Number -> Number
average [] = 0.0
average xs = foldl (+) 0.0 xs / (fromIntegral (length xs))
  where
    fromIntegral n = if n == 0 then 1.0 else toNumber n

-- Get letter grade from numeric score
letterGrade :: Number -> String
letterGrade score
  | score >= 90.0 = "A"
  | score >= 80.0 = "B"
  | score >= 70.0 = "C"
  | score >= 60.0 = "D"
  | otherwise     = "F"

-- Filter students by major
filterByMajor :: String -> Array Student -> Array Student
filterByMajor major students =
  filter (\s -> toLower (trim s.major) == toLower (trim major)) students

-- Sort students by average grade (descending)
rankStudents :: Array Student -> Array Student
rankStudents = sortBy (comparing (\s -> -(average s.grades)))

-- Get honor roll (average >= 90)
honorRoll :: Array Student -> Array Student
honorRoll students =
  filter (\s -> average s.grades >= 90.0) students

main :: Effect Unit
main = do
  let students =
        [ { id: 1, name: "Alice", grades: [95.0, 88.0, 92.0], major: "CS" }
        , { id: 2, name: "Bob",   grades: [72.0, 68.0, 75.0], major: "Math" }
        , { id: 3, name: "Carol", grades: [91.0, 95.0, 89.0], major: "CS" }
        ]
  let csStudents = filterByMajor "CS" students
  let ranked = rankStudents csStudents
  logShow $ map _.name ranked
