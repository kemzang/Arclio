<script context="module">
  export const prerender = false;

  export async function load({ fetch }) {
    const res = await fetch('/api/items');
    const items = await res.json();
    return { props: { items } };
  }

  export function formatItem(item) {
    return item.name.trim();
  }
</script>

<script>
  export let items = [];
  let expanded = false;
  let selected = null;

  function toggle() {
    expanded = !expanded;
  }

  function select(item) {
    selected = item;
  }
</script>

<div class="container">
  <button on:click={toggle}>
    {expanded ? 'Collapse' : 'Expand'}
  </button>

  {#if expanded}
    <ul>
      {#each items as item}
        <li on:click={() => select(item)}>{item.name}</li>
      {/each}
    </ul>
  {/if}

  {#if selected}
    <p>Selected: {selected.name}</p>
  {/if}
</div>
