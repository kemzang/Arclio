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

        /// Drain all elements into a slice (caller owns memory)
        pub fn toOwnedSlice(self: *Self) ![]T {
            return self.items.toOwnedSlice();
        }
    };
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var stack = Stack([]const u8).init(allocator);
    defer stack.deinit();

    try stack.push("hello");
    try stack.push("world");
    try stack.push("zig");

    std.debug.print("Peek: {s}\n", .{stack.peek().?});
    while (stack.pop()) |item| {
        std.debug.print("Popped: {s}\n", .{item});
    }
}
