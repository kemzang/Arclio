\begin{code}
module DataProcessor where

import Data.List (sortBy, groupBy, nub)
import Data.Ord  (comparing, Down(..))
import Data.Maybe (mapMaybe, fromMaybe)

-- | Validate a non-empty string value.
validateInput :: String -> Either String String
validateInput value
  | null value        = Left "Input cannot be empty"
  | length value > 255 = Left "Input exceeds maximum length"
  | otherwise         = Right value

-- | Safely parse an integer.
parseIntSafe :: String -> Maybe Int
parseIntSafe s =
  case reads s of
    [(n, "")] -> Just n
    _         -> Nothing

-- | Group list elements by a key function.
groupItems :: Ord k => (a -> k) -> [a] -> [(k, [a])]
groupItems keyFn items =
  map (\g -> (keyFn (head g), g))
  . groupBy (\a b -> keyFn a == keyFn b)
  . sortBy (comparing keyFn)
  $ items
\end{code}

> -- File-specific: compute frequency map
> frequency :: Ord a => [a] -> [(a, Int)]
> frequency xs = map (\g -> (head g, length g)) . groupBy (==) . sortBy compare $ xs
