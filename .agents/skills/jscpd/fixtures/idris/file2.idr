module BinaryTree

import Data.List
import Data.Maybe

-- A binary search tree data structure
data Tree a = Leaf | Node (Tree a) a (Tree a)

-- Insert a value into a BST
insert : Ord a => a -> Tree a -> Tree a
insert x Leaf = Node Leaf x Leaf
insert x (Node left val right) =
  if x < val
    then Node (insert x left) val right
    else if x > val
      then Node left val (insert x right)
      else Node left val right

-- Check if a value is in the tree
member : Ord a => a -> Tree a -> Bool
member x Leaf = False
member x (Node left val right) =
  if x == val
    then True
    else if x < val
      then member x left
      else member x right

-- Convert tree to sorted list via inorder traversal
toSortedList : Tree a -> List a
toSortedList Leaf = []
toSortedList (Node left val right) =
  toSortedList left ++ [val] ++ toSortedList right

-- Count nodes in tree
size : Tree a -> Nat
size Leaf = 0
size (Node left _ right) = 1 + size left + size right

main : IO ()
main = do
  let t = foldr insert Leaf [5, 3, 7, 1, 4, 6, 8, 2]
  putStrLn $ "Sorted: " ++ show (toSortedList t)
  putStrLn $ "Size: " ++ show (size t)
