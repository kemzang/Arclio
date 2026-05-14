library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

-- Common VHDL utility package
package CommonPkg is
    constant CLK_FREQ_HZ : integer := 100_000_000;
    constant RESET_CYCLES : integer := 16;

    type t_state is (IDLE, ACTIVE, DONE, ERROR_STATE);

    function to_slv(val : integer; width : positive) return std_logic_vector;
    function count_ones(slv : std_logic_vector) return integer;
end package CommonPkg;

package body CommonPkg is
    function to_slv(val : integer; width : positive) return std_logic_vector is
    begin
        return std_logic_vector(to_unsigned(val, width));
    end function;

    function count_ones(slv : std_logic_vector) return integer is
        variable cnt : integer := 0;
    begin
        for i in slv'range loop
            if slv(i) = '1' then cnt := cnt + 1; end if;
        end loop;
        return cnt;
    end function;
end package body CommonPkg;

-- File-specific: 16-bit register entity
entity Reg16 is
    port (
        clk   : in  std_logic;
        rst_n : in  std_logic;
        d     : in  std_logic_vector(15 downto 0);
        q     : out std_logic_vector(15 downto 0)
    );
end entity Reg16;

architecture rtl of Reg16 is
begin
    process(clk, rst_n) begin
        if rst_n = '0' then q <= (others => '0');
        elsif rising_edge(clk) then q <= d;
        end if;
    end process;
end architecture rtl;
