// Zig - Generic data structures
const std = @import("std");
const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;

/// A generic stack implemented with an ArrayList
pub fn Stack(comptime T: type) type {
    return struct {
        const Self = @This();

        items: ArrayList(T),

        pub fn init(allocator: Allocator) Self {
            return Self{
                .items = ArrayList(T).init(allocator),
            };
        }

        pub fn deinit(self: *Self) void {
            self.items.deinit();
        }

        pub fn push(self: *Self, item: T) !void {
            try self.items.append(item);
        }

        pub fn pop(self: *Self) ?T {
            if (self.items.items.len == 0) return null;
            return self.items.pop();
        }

        pub fn peek(self: Self) ?T {
            if (self.items.items.len == 0) return null;
            return self.items.items[self.items.items.len - 1];
        }

        pub fn len(self: Self) usize {
            return self.items.items.len;
        }

        pub fn isEmpty(self: Self) bool {
            return self.items.items.len == 0;
        }
    };
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var stack = Stack(i32).init(allocator);
    defer stack.deinit();

    try stack.push(10);
    try stack.push(20);
    try stack.push(30);

    std.debug.print("Peek: {?}\n", .{stack.peek()});
    std.debug.print("Pop:  {?}\n", .{stack.pop()});
    std.debug.print("Len:  {}\n",  .{stack.len()});
}
