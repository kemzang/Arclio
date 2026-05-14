<script lang="ts">
  let name: string = 'world';
  let count: number = 0;
  let active: boolean = false;

  function greet(who: string): string {
    return `Hello, ${who}!`;
  }

  function increment(n: number): number {
    return n + 1;
  }

  function toggle(state: boolean): boolean {
    return !state;
  }
</script>

<p>{greet(name)}</p>
<p>Count: {count}</p>
<p>Active: {active}</p>
