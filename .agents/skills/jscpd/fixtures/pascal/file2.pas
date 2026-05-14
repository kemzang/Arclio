program DataProcessor;

uses
  SysUtils, Classes, Math;

type
  TDataRecord = record
    Id    : Integer;
    Name  : string;
    Value : Double;
    Active: Boolean;
  end;

function ValidateInput(const Value: string): Boolean;
begin
  Result := (Length(Value) > 0) and (Length(Value) <= 255);
end;

function ParseIntSafe(const S: string; out Value: Integer): Boolean;
begin
  Result := TryStrToInt(S, Value);
end;

procedure SortByValue(var Arr: array of Double);
var
  I, J  : Integer;
  Temp  : Double;
begin
  for I := Low(Arr) to High(Arr) - 1 do
    for J := Low(Arr) to High(Arr) - I - 1 do
      if Arr[J] > Arr[J + 1] then
      begin
        Temp     := Arr[J];
        Arr[J]   := Arr[J + 1];
        Arr[J+1] := Temp;
      end;
end;

// File-specific: compute minimum
function FindMinimum(const Arr: array of Double): Double;
var
  I      : Integer;
  MinVal : Double;
begin
  MinVal := Arr[Low(Arr)];
  for I := Low(Arr) + 1 to High(Arr) do
    if Arr[I] < MinVal then MinVal := Arr[I];
  Result := MinVal;
end;

begin
  WriteLn('Data Processor v2');
end.
