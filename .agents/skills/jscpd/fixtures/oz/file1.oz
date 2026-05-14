declare
   fun {ValidateInput Value}
      if {String.length Value} == 0 then
         error(msg: "Input cannot be empty")
      elseif {String.length Value} > 255 then
         error(msg: "Input exceeds maximum length")
      else
         ok(value: Value)
      end
   end

   fun {ParseInt Str}
      try
         {String.toInt Str}
      catch _ then
         unit
      end
   end

   fun {MapList Lst Fn}
      case Lst of
         nil     then nil
      [] H|T  then {Fn H}|{MapList T Fn}
      end
   end

   fun {FilterList Lst Pred}
      case Lst of
         nil    then nil
      [] H|T then
         if {Pred H} then H|{FilterList T Pred}
         else {FilterList T Pred}
         end
      end
   end

   % File-specific: sum a list
   fun {SumList Lst}
      case Lst of
         nil   then 0
      [] H|T then H + {SumList T}
      end
   end

in
   {Browse {ValidateInput "hello"}}
end
