;;; Common Scheme utility functions

(define (validate-input value)
  (cond
    ((not (string? value))
     (error "Input must be a string"))
    ((= (string-length value) 0)
     (error "Input cannot be empty"))
    ((> (string-length value) 255)
     (error "Input exceeds maximum length"))
    (else value)))

(define (parse-int str)
  (let ((n (string->number str)))
    (and n (exact? n) n)))

(define (list-sum lst)
  (fold-left + 0 lst))

(define (list-map fn lst)
  (if (null? lst)
      '()
      (cons (fn (car lst))
            (list-map fn (cdr lst)))))

(define (list-filter pred lst)
  (cond
    ((null? lst) '())
    ((pred (car lst))
     (cons (car lst) (list-filter pred (cdr lst))))
    (else (list-filter pred (cdr lst)))))

;; File-specific: find maximum
(define (list-max lst)
  (fold-left max (car lst) (cdr lst)))
