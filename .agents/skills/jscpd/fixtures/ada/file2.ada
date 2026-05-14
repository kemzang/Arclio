with Ada.Text_IO; use Ada.Text_IO;
with Ada.Float_Text_IO; use Ada.Float_Text_IO;

procedure Statistics is
   type Float_Array is array (1 .. 10) of Float;

   function Sum(Arr : Float_Array) return Float is
      Total : Float := 0.0;
   begin
      for I in Arr'Range loop
         Total := Total + Arr(I);
      end loop;
      return Total;
   end Sum;

   function Average(Arr : Float_Array) return Float is
   begin
      return Sum(Arr) / Float(Arr'Length);
   end Average;

   function Minimum(Arr : Float_Array) return Float is
      Min : Float := Arr(Arr'First);
   begin
      for I in Arr'Range loop
         if Arr(I) < Min then
            Min := Arr(I);
         end if;
      end loop;
      return Min;
   end Minimum;

   Data : Float_Array := (3.0, 7.0, 2.0, 9.0, 4.0, 6.0, 1.0, 8.0, 5.0, 10.0);
begin
   Put_Line("Sum: " & Float'Image(Sum(Data)));
   Put_Line("Average: " & Float'Image(Average(Data)));
   Put_Line("Minimum: " & Float'Image(Minimum(Data)));
end Statistics;
