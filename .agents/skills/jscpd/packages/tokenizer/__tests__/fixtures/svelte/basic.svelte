<script>
  let count = 0;
  let message = 'hello';

  function increment() {
    count += 1;
  }

  function reset() {
    count = 0;
    message = 'reset';
  }
</script>

<button on:click={increment}>
  Count: {count}
</button>

<button on:click={reset}>
  Reset
</button>

<p>{message}</p>

<style>
  button {
    padding: 8px 16px;
    background: steelblue;
    color: white;
    border: none;
    cursor: pointer;
  }

  button:hover {
    opacity: 0.85;
  }

  p {
    margin-top: 1rem;
    font-size: 1.2rem;
  }
</style>
