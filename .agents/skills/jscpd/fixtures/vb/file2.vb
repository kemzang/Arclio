Public Module DataUtils

    Public Function ValidateInput(ByVal value As String) As Boolean
        If String.IsNullOrWhiteSpace(value) Then
            Return False
        End If
        If value.Length > 255 Then
            Return False
        End If
        Return True
    End Function

    Public Function ParseIntSafe(ByVal s As String) As Integer?
        Dim result As Integer
        If Integer.TryParse(s, result) Then
            Return result
        End If
        Return Nothing
    End Function

    Public Function FilterActive(Of T)(ByVal items As IEnumerable(Of T),
                                       ByVal predicate As Func(Of T, Boolean)) As IEnumerable(Of T)
        Return items.Where(predicate)
    End Function

    Public Function MapItems(Of T, U)(ByVal items As IEnumerable(Of T),
                                       ByVal transform As Func(Of T, U)) As IEnumerable(Of U)
        Return items.Select(transform)
    End Function

    ' File-specific: max value
    Public Function MaxValue(ByVal items As IEnumerable(Of Integer)) As Integer
        Return items.Max()
    End Function

End Module
