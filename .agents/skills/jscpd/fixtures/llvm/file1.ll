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

; Find the maximum value in an integer array
define i32 @arrayMax(i32* %arr, i32 %len) {
entry:
  %max = alloca i32, align 4
  %first = load i32, i32* %arr
  store i32 %first, i32* %max
  %i = alloca i32, align 4
  store i32 1, i32* %i
  br label %loop2

loop2:
  %i2 = load i32, i32* %i
  %cond2 = icmp slt i32 %i2, %len
  br i1 %cond2, label %body2, label %exit2

body2:
  %idx2 = getelementptr i32, i32* %arr, i32 %i2
  %val2 = load i32, i32* %idx2
  %cur_max = load i32, i32* %max
  %is_greater = icmp sgt i32 %val2, %cur_max
  br i1 %is_greater, label %update, label %continue

update:
  store i32 %val2, i32* %max
  br label %continue

continue:
  %next_i2 = add i32 %i2, 1
  store i32 %next_i2, i32* %i
  br label %loop2

exit2:
  %result2 = load i32, i32* %max
  ret i32 %result2
}
