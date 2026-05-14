#lang racket

;; Binary search tree implementation in Racket

(struct node (left val right) #:transparent)

;; Insert a value into BST
(define (bst-insert tree val)
  (cond
    [(eq? tree 'empty)
     (node 'empty val 'empty)]
    [(< val (node-val tree))
     (node (bst-insert (node-left tree) val)
           (node-val tree)
           (node-right tree))]
    [(> val (node-val tree))
     (node (node-left tree)
           (node-val tree)
           (bst-insert (node-right tree) val))]
    [else tree]))

;; Check membership in BST
(define (bst-member? tree val)
  (cond
    [(eq? tree 'empty) #f]
    [(= val (node-val tree)) #t]
    [(< val (node-val tree)) (bst-member? (node-left tree) val)]
    [else (bst-member? (node-right tree) val)]))

;; Convert BST to sorted list (inorder traversal)
(define (bst->list tree)
  (if (eq? tree 'empty)
      '()
      (append (bst->list (node-left tree))
              (list (node-val tree))
              (bst->list (node-right tree)))))

;; Build a BST from a list of values
(define (list->bst lst)
  (foldl (lambda (val tree) (bst-insert tree val))
         'empty
         lst))

;; Test it
(define test-tree (list->bst '(5 3 7 1 4 6 8 2)))
(displayln (bst->list test-tree))
(displayln (bst-member? test-tree 4))
(displayln (bst-member? test-tree 9))
