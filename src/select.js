// Select-only comboboxes keep native selects as the source of values.
// The fixed-position listboxes avoid clipping inside the settings panel.
const controls = [];
let active = null;

export function closeSelects() { active?.close(); }
export function syncSelects() { controls.forEach(control => control.sync()); }

export function initializeSelects() {
  document.querySelectorAll('select[data-custom]').forEach((select, index) => {
    const options = [...select.options];
    const label = document.querySelector(`label[for="${select.id}"]`);
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `${select.id}-combobox`;
    button.className = 'select-trigger';
    button.setAttribute('role', 'combobox');
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', `select-list-${index}`);
    button.setAttribute('aria-labelledby', `${label.id} ${button.id}-value`);
    const value = document.createElement('span');
    value.id = `${button.id}-value`;
    value.className = 'select-value';
    button.append(value);
    const arrow = document.createElement('span');
    arrow.className = 'select-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    button.append(arrow);
    const list = document.createElement('div');
    list.id = `select-list-${index}`;
    list.className = 'select-list';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-labelledby', label.id);
    list.hidden = true;
    document.body.append(list);
    select.after(button);
    select.hidden = true;
    label.htmlFor = button.id;
    let highlighted = select.selectedIndex;
    let search = '';
    let lastKeyTime = 0;

    function content(option) {
      const span = document.createElement('span');
      span.className = 'select-option-content';
      if (option.dataset.color) {
        const swatch = document.createElement('i');
        swatch.style.backgroundColor = option.dataset.color;
        swatch.setAttribute('aria-hidden', 'true');
        span.append(swatch);
      }
      const text = document.createElement('span');
      text.textContent = option.textContent;
      span.append(text);
      return span;
    }
    const items = options.map((option, optionIndex) => {
      const item = document.createElement('div');
      item.id = `${list.id}-option-${optionIndex}`;
      item.setAttribute('role', 'option');
      item.className = 'select-option';
      item.append(content(option));
      list.append(item);
      item.addEventListener('pointerdown', event => event.preventDefault());
      item.addEventListener('click', () => choose(optionIndex));
      return item;
    });

    function position() {
      const rect = button.getBoundingClientRect();
      const height = Math.min(options.length * 48 + 10, 250);
      list.style.width = `${Math.min(rect.width, innerWidth - 24)}px`;
      list.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - rect.width - 12))}px`;
      list.style.top = `${innerHeight - rect.bottom >= height + 8 ? rect.bottom + 7 : Math.max(8, rect.top - height - 7)}px`;
      list.style.maxHeight = `${Math.min(height, innerHeight - 24)}px`;
    }
    function highlight(optionIndex) {
      highlighted = (optionIndex + options.length) % options.length;
      items.forEach((item, i) => item.classList.toggle('highlighted', i === highlighted));
      button.setAttribute('aria-activedescendant', items[highlighted].id);
      items[highlighted].scrollIntoView({ block: 'nearest' });
    }
    function open() {
      if (button.disabled) return;
      active?.close();
      active = control;
      list.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      position();
      highlight(select.selectedIndex);
    }
    function close() {
      list.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      button.removeAttribute('aria-activedescendant');
      if (active === control) active = null;
    }
    function choose(optionIndex) {
      select.selectedIndex = optionIndex;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      control.sync();
      close();
      button.focus({ preventScroll: true });
    }
    const control = {
      close,
      sync() {
        const selected = Math.max(0, select.selectedIndex);
        value.replaceChildren(content(options[selected]));
        button.disabled = select.disabled || select.closest('fieldset')?.disabled || false;
        items.forEach((item, i) => item.setAttribute('aria-selected', String(i === selected)));
        if (button.disabled) close();
      },
    };
    controls.push(control);
    button.addEventListener('click', () => list.hidden ? open() : close());
    button.addEventListener('keydown', event => {
      const key = event.key;
      if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(key)) {
        event.preventDefault();
        const wasOpen = !list.hidden;
        if (!wasOpen) open();
        if (key === 'ArrowDown') highlight(highlighted + (wasOpen ? 1 : 0));
        if (key === 'ArrowUp') highlight(highlighted - (wasOpen ? 1 : 0));
        if (key === 'Home') highlight(0);
        if (key === 'End') highlight(options.length - 1);
        if (wasOpen && (key === 'Enter' || key === ' ')) choose(highlighted);
      } else if (key === 'Escape') {
        close();
      } else if (key === 'Tab' && !list.hidden) {
        choose(highlighted);
      } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        const now = Date.now();
        search = now - lastKeyTime > 700 ? key : search + key;
        lastKeyTime = now;
        if (list.hidden) open();
        const match = options.findIndex(option => option.textContent.toLocaleLowerCase('ru').startsWith(search.toLocaleLowerCase('ru')));
        if (match >= 0) highlight(match);
      }
    });
    document.addEventListener('pointerdown', event => {
      if (!button.contains(event.target) && !list.contains(event.target)) close();
    });
    window.addEventListener('resize', close);
    window.addEventListener('scroll', () => {
      if (!list.hidden) position();
    }, true);
    control.sync();
  });
}
