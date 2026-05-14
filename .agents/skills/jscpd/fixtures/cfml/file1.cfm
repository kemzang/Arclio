<!DOCTYPE html>
<html>
<head>
    <title>Product Listing</title>
</head>
<body>

<cfset datasource = "myDSN">
<cfset category = url.category ?: "all">

<cfquery name="getProducts" datasource="#datasource#">
    SELECT ProductID, ProductName, Price, StockQty, CategoryID
    FROM Products
    WHERE IsActive = 1
    <cfif category NEQ "all">
        AND CategoryID = <cfqueryparam value="#category#" cfsqltype="CF_SQL_INTEGER">
    </cfif>
    ORDER BY ProductName ASC
</cfquery>

<h2>Product Listing</h2>

<cfif getProducts.RecordCount EQ 0>
    <p>No products found.</p>
<cfelse>
    <table border="1">
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
            </tr>
        </thead>
        <tbody>
        <cfloop query="getProducts">
            <tr>
                <td><cfoutput>#getProducts.ProductID#</cfoutput></td>
                <td><cfoutput>#getProducts.ProductName#</cfoutput></td>
                <td><cfoutput>#NumberFormat(getProducts.Price, '9,999.99')#</cfoutput></td>
                <td><cfoutput>#getProducts.StockQty#</cfoutput></td>
            </tr>
        </cfloop>
        </tbody>
    </table>
</cfif>

</body>
</html>
