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

(: File-specific: get user by id :)
declare function app:get-user($users as element()*, $id as xs:integer) as element()? {
    $users[@id = $id][1]
};

let $users := (
    <user id="1" name="alice" value="100" active="true"/>,
    <user id="2" name="bob"   value="200" active="false"/>
)
return app:sum-values($users)
