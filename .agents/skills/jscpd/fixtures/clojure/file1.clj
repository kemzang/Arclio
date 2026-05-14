(ns myapp.core
  (:require [clojure.string :as str]))

(defn process-items [coll]
  (map (fn [item]
         {:id    (:id item)
          :name  (str/upper-case (:name item))
          :value (* (:value item) 2)})
       coll))

(defn filter-active [coll]
  (filter #(:active %) coll))

(defn sum-values [coll]
  (reduce + (map :value coll)))

(defn find-by-id [coll id]
  (first (filter #(= (:id %) id) coll)))

; File-specific: fetch users
(defn fetch-users []
  {:users [{:id 1 :name "alice" :value 10 :active true}
           {:id 2 :name "bob"   :value 20 :active false}]})
