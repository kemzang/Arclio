xquery version "3.1";

(: Common XQuery utility functions :)

declare namespace app = "http://example.com/app";

declare function app:validate-input($value as xs:string) as xs:boolean {
    string-length($value) gt 0
    and string-length($value) le 255
};

declare function app:parse-int($s as xs:string) as xs:integer? {
    if (matches($s, '^\d+$'))
    then xs:integer($s)
    else ()
};

declare function app:filter-active($items as element()*) as element()* {
    $items[@active = 'true']
};

declare function app:map-names($items as element()*) as xs:string* {
    for $item in $items
    return upper-case($item/@name/string())
};

declare function app:sum-values($items as element()*) as xs:decimal {
    sum($items/@value/number())
};

(: File-specific: get product by id :)
declare function app:get-product($products as element()*, $id as xs:integer) as element()? {
    $products[@id = $id][1]
};

let $products := (
    <product id="1" name="widget" value="99"  active="true"/>,
    <product id="2" name="gadget" value="149" active="true"/>
)
return app:sum-values($products)
