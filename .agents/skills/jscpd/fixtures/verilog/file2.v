// Common Verilog utility modules

module ClockDivider #(
    parameter CLK_DIV = 2
) (
    input  wire clk_in,
    input  wire rst_n,
    output reg  clk_out
);
    reg [$clog2(CLK_DIV)-1:0] counter;

    always @(posedge clk_in or negedge rst_n) begin
        if (!rst_n) begin
            counter <= 0;
            clk_out <= 0;
        end else if (counter == CLK_DIV/2 - 1) begin
            counter <= 0;
            clk_out <= ~clk_out;
        end else begin
            counter <= counter + 1;
        end
    end
endmodule

module SyncReset (
    input  wire clk,
    input  wire async_rst_n,
    output reg  sync_rst_n
);
    reg meta_ff;
    always @(posedge clk or negedge async_rst_n) begin
        if (!async_rst_n) begin
            meta_ff    <= 1'b0;
            sync_rst_n <= 1'b0;
        end else begin
            meta_ff    <= 1'b1;
            sync_rst_n <= meta_ff;
        end
    end
endmodule

// File-specific: 16-bit counter
module Counter16 (
    input  wire clk,
    input  wire rst_n,
    output reg  [15:0] count
);
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) count <= 16'h0000;
        else        count <= count + 1;
    end
endmodule
