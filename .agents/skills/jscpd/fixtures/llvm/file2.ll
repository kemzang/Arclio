; LLVM IR Module - Vector operations
target datalayout = "e-m:e-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64-unknown-linux-gnu"

; Compute the sum of an integer array
define i64 @arraySum(i32* %arr, i32 %len) {
entry:
  %sum = alloca i64, align 8
  %i = alloca i32, align 4
  store i64 0, i64* %sum
  store i32 0, i32* %i
  br label %loop

loop:
  %i_val = load i32, i32* %i
  %cond = icmp slt i32 %i_val, %len
  br i1 %cond, label %body, label %exit

body:
  %idx = getelementptr i32, i32* %arr, i32 %i_val
  %elem = load i32, i32* %idx
  %elem64 = sext i32 %elem to i64
  %cur = load i64, i64* %sum
  %new_sum = add i64 %cur, %elem64
  store i64 %new_sum, i64* %sum
  %next_i = add i32 %i_val, 1
  store i32 %next_i, i32* %i
  br label %loop

exit:
  %result = load i64, i64* %sum
  ret i64 %result
}

; Compute the product of an integer array
define i64 @arrayProduct(i32* %arr, i32 %len) {
entry:
  %prod = alloca i64, align 8
  %i = alloca i32, align 4
  store i64 1, i64* %prod
  store i32 0, i32* %i
  br label %loop3

loop3:
  %i3 = load i32, i32* %i
  %cond3 = icmp slt i32 %i3, %len
  br i1 %cond3, label %body3, label %exit3

body3:
  %idx3 = getelementptr i32, i32* %arr, i32 %i3
  %elem3 = load i32, i32* %idx3
  %elem64_3 = sext i32 %elem3 to i64
  %cur3 = load i64, i64* %prod
  %new_prod = mul i64 %cur3, %elem64_3
  store i64 %new_prod, i64* %prod
  %next_i3 = add i32 %i3, 1
  store i32 %next_i3, i32* %i
  br label %loop3

exit3:
  %result3 = load i64, i64* %prod
  ret i64 %result3
}
