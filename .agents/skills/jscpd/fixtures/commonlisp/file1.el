;;; Common Elisp utility functions

(defun validate-string (value)
  "Return VALUE if it is a non-empty string, otherwise signal an error.

Signals an error when VALUE is not a string or when it is empty."
  (unless (stringp value)
    (error "Input must be a string"))
  (when (= (length value) 0)
    (error "Input cannot be empty"))
  (when (> (length value) 255)
    (error "Input exceeds maximum length"))
  value)

(defun parse-integer-safe (str)
  "Parse STR as an integer, returning nil on failure."
  (let ((n (string-to-number str)))
    (and (not (= n 0))
         (integerp n)
         n)))

(defun list-sum (lst)
  "Return the sum of all elements in LST."
  (apply #'+ lst))

(defun list-map (fn lst)
  "Apply FN to each element of LST, returning a new list."
  (if (null lst)
      nil
    (cons (funcall fn (car lst))
          (list-map fn (cdr lst)))))

(defun list-filter (pred lst)
  "Return a list of elements in LST satisfying PRED."
  (cond
   ((null lst) nil)
   ((funcall pred (car lst))
    (cons (car lst) (list-filter pred (cdr lst))))
   (t (list-filter pred (cdr lst)))))

(defun format-not-found-message (name)
  "Return a user-facing error string for a missing symbol NAME.

The message spans multiple lines using a backslash line continuation
to keep source lines short."
  (format "Symbol `%s` was not found in the current environment. \
Please check the spelling or ensure the relevant package is loaded."
          name))

;; File-specific: find maximum value
(defun list-max (lst)
  "Return the largest element of LST."
  (apply #'max lst))
