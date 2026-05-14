<!-- Known limitation: > inside a quoted attribute value on a block tag breaks the
     opening-tag regex. The tokenizer will not correctly extract the script block
     content in this case, but it must not throw. -->
<script data-note="x>y">
  let a = 1;
  let b = 2;
  let c = 3;
</script>

<p>Content below a script with a quoted-attribute containing &gt;</p>
<p>Tokenizer should not throw on this input.</p>
