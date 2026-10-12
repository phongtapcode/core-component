# Quick start

```html
<script type="module" src="https://esm.sh/@ui/components"></script>

<!-- Motion -->
<ui-animate effect="fade-up">Hello</ui-animate>

<!-- Toggle -->
<ui-toggle label="Notifications"></ui-toggle>

<!-- Tabs -->
<ui-tabs>
  <div role="tablist">
    <button role="tab" id="t1" aria-controls="p1">One</button>
    <button role="tab" id="t2" aria-controls="p2">Two</button>
  </div>
  <div role="tabpanel" id="p1" aria-labelledby="t1">Panel 1</div>
  <div role="tabpanel" id="p2" aria-labelledby="t2">Panel 2</div>
</ui-tabs>

<!-- Modal -->
<button id="open-modal">Open modal</button>
<ui-modal>
  <div data-modal-overlay></div>
  <div data-modal-dialog>
    <h2>Title</h2>
    <p>Body</p>
    <button data-modal-close>Close</button>
  </div>
</ui-modal>

<script type="module">
  document.getElementById('open-modal').addEventListener('click', () => {
    document.querySelector('ui-modal').openModal();
  });
</script>
```

That's it. The library auto-upgrades your markup and listens for interactions.