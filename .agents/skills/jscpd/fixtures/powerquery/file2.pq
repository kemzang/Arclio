// Power Query M - ETL for sales data
let
    // Load raw sales data from CSV
    Source = Csv.Document(
        File.Contents("C:\Data\sales.csv"),
        [Delimiter=",", Columns=8, Encoding=65001, QuoteStyle=QuoteStyle.None]
    ),

    // Promote first row to headers
    PromotedHeaders = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),

    // Change column types
    TypedTable = Table.TransformColumnTypes(PromotedHeaders, {
        {"OrderId",     type text},
        {"OrderDate",   type date},
        {"CustomerId",  type text},
        {"ProductId",   type text},
        {"Quantity",    Int64.Type},
        {"UnitPrice",   type number},
        {"Discount",    type number},
        {"Region",      type text}
    }),

    // Add calculated columns
    WithRevenue = Table.AddColumn(
        TypedTable, "Revenue",
        each [Quantity] * [UnitPrice] * (1 - [Discount]),
        type number
    ),

    WithYear = Table.AddColumn(
        WithRevenue, "OrderYear",
        each Date.Year([OrderDate]),
        Int64.Type
    ),

    WithQuarter = Table.AddColumn(
        WithYear, "OrderQuarter",
        each "Q" & Text.From(Date.QuarterOfYear([OrderDate])),
        type text
    ),

    // Group by region and year, sum revenue
    Grouped = Table.Group(
        WithQuarter,
        {"Region", "OrderYear"},
        {{"TotalRevenue", each List.Sum([Revenue]), type number},
         {"OrderCount",   each Table.RowCount(_),   Int64.Type}}
    ),

    // Sort by region then year
    SortedGroups = Table.Sort(
        Grouped,
        {{"Region", Order.Ascending}, {"OrderYear", Order.Ascending}}
    )
in
    SortedGroups
