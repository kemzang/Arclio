(ns myapp.products
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

; File-specific: fetch products
(defn fetch-products []
  {:products [{:id 1 :name "widget" :value 99 :active true}
              {:id 2 :name "gadget" :value 49 :active true}]})
