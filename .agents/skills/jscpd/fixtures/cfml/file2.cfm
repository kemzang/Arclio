<!DOCTYPE html>
<html>
<head>
    <title>Order Listing</title>
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

<cfquery name="getOrders" datasource="#datasource#">
    SELECT OrderID, CustomerName, OrderDate, TotalAmount, Status
    FROM Orders
    WHERE IsActive = 1
    ORDER BY OrderDate DESC
</cfquery>

<h2>Order Listing</h2>

<cfif getOrders.RecordCount EQ 0>
    <p>No orders found.</p>
<cfelse>
    <table border="1">
        <thead>
            <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
        <cfloop query="getOrders">
            <tr>
                <td><cfoutput>#getOrders.OrderID#</cfoutput></td>
                <td><cfoutput>#getOrders.CustomerName#</cfoutput></td>
                <td><cfoutput>#DateFormat(getOrders.OrderDate, 'mm/dd/yyyy')#</cfoutput></td>
                <td><cfoutput>#NumberFormat(getOrders.TotalAmount, '9,999.99')#</cfoutput></td>
                <td><cfoutput>#getOrders.Status#</cfoutput></td>
            </tr>
        </cfloop>
        </tbody>
    </table>
</cfif>

</body>
</html>
