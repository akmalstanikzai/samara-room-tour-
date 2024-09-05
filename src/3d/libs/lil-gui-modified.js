/**
 * lil-gui
 * https://lil-gui.georgealways.com
 * @version 0.16.0
 * @author George Michael Brower
 * @license MIT
 */
class t {
  constructor(i, e, s, n, r = 'div') {
    (this.parent = i),
      (this.object = e),
      (this.property = s),
      (this._disabled = !1),
      (this.initialValue = this.getValue()),
      (this.domElement = document.createElement('div')),
      this.domElement.classList.add('controller'),
      this.domElement.classList.add(n),
      (this.$name = document.createElement('div')),
      this.$name.classList.add('name'),
      (t.nextNameID = t.nextNameID || 0),
      (this.$name.id = 'lil-gui-name-' + ++t.nextNameID),
      (this.$widget = document.createElement(r)),
      this.$widget.classList.add('widget'),
      (this.$disable = this.$widget),
      this.domElement.appendChild(this.$name),
      this.domElement.appendChild(this.$widget),
      this.parent.children.push(this),
      this.parent.controllers.push(this),
      this.parent.$children.appendChild(this.domElement),
      (this._listenCallback = this._listenCallback.bind(this)),
      this.name(s);
  }
  name(t) {
    return (this._name = t), (this.$name.innerHTML = t), this;
  }
  onChange(t) {
    return (this._onChange = t), this;
  }
  _callOnChange() {
    this.parent._callOnChange(this),
      void 0 !== this._onChange && this._onChange.call(this, this.getValue()),
      (this._changed = !0);
  }
  onFinishChange(t) {
    return (this._onFinishChange = t), this;
  }
  _callOnFinishChange() {
    this._changed &&
      (this.parent._callOnFinishChange(this),
      void 0 !== this._onFinishChange &&
        this._onFinishChange.call(this, this.getValue())),
      (this._changed = !1);
  }
  reset() {
    return this.setValue(this.initialValue), this._callOnFinishChange(), this;
  }
  enable(t = !0) {
    return this.disable(!t);
  }
  disable(t = !0) {
    return (
      t === this._disabled ||
        ((this._disabled = t),
        this.domElement.classList.toggle('disabled', t),
        this.$disable.toggleAttribute('disabled', t)),
      this
    );
  }
  options(t) {
    const i = this.parent.add(this.object, this.property, t);
    return i.name(this._name), this.destroy(), i;
  }
  min(t) {
    return this;
  }
  max(t) {
    return this;
  }
  step(t) {
    return this;
  }
  listen(t = !0) {
    return (
      (this._listening = t),
      void 0 !== this._listenCallbackID &&
        (cancelAnimationFrame(this._listenCallbackID),
        (this._listenCallbackID = void 0)),
      this._listening && this._listenCallback(),
      this
    );
  }
  _listenCallback() {
    (this._listenCallbackID = requestAnimationFrame(this._listenCallback)),
      this.updateDisplay();
  }
  getValue() {
    return this.object[this.property];
  }
  setValue(t) {
    return (
      (this.object[this.property] = t),
      this._callOnChange(),
      this.updateDisplay(),
      this
    );
  }
  updateDisplay() {
    return this;
  }
  load(t) {
    return this.setValue(t), this._callOnFinishChange(), this;
  }
  save() {
    return this.getValue();
  }
  destroy() {
    this.parent.children.splice(this.parent.children.indexOf(this), 1),
      this.parent.controllers.splice(this.parent.controllers.indexOf(this), 1),
      this.parent.$children.removeChild(this.domElement);
  }
}
class i extends t {
  constructor(t, i, e) {
    super(t, i, e, 'boolean', 'label'),
      (this.$input = document.createElement('input')),
      this.$input.setAttribute('type', 'checkbox'),
      this.$input.setAttribute('aria-labelledby', this.$name.id),
      this.$widget.appendChild(this.$input),
      this.$input.addEventListener('change', () => {
        this.setValue(this.$input.checked), this._callOnFinishChange();
      }),
      (this.$disable = this.$input),
      this.updateDisplay();
  }
  updateDisplay() {
    return (this.$input.checked = this.getValue()), this;
  }
}
function e(t) {
  let i, e;
  return (
    (i = t.match(/(#|0x)?([a-f0-9]{6})/i))
      ? (e = i[2])
      : (i = t.match(/rgb\(\s*(\d*)\s*,\s*(\d*)\s*,\s*(\d*)\s*\)/))
      ? (e =
          parseInt(i[1]).toString(16).padStart(2, 0) +
          parseInt(i[2]).toString(16).padStart(2, 0) +
          parseInt(i[3]).toString(16).padStart(2, 0))
      : (i = t.match(/^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i)) &&
        (e = i[1] + i[1] + i[2] + i[2] + i[3] + i[3]),
    !!e && '#' + e
  );
}
const s = {
    isPrimitive: !0,
    match: (t) => 'string' == typeof t,
    fromHexString: e,
    toHexString: e,
  },
  n = {
    isPrimitive: !0,
    match: (t) => 'number' == typeof t,
    fromHexString: (t) => parseInt(t.substring(1), 16),
    toHexString: (t) => '#' + t.toString(16).padStart(6, 0),
  },
  r = {
    isPrimitive: !1,
    match: Array.isArray,
    fromHexString(t, i, e = 1) {
      const s = n.fromHexString(t);
      (i[0] = (((s >> 16) & 255) / 255) * e),
        (i[1] = (((s >> 8) & 255) / 255) * e),
        (i[2] = ((255 & s) / 255) * e);
    },
    toHexString: ([t, i, e], s = 1) =>
      n.toHexString(
        ((t * (s = 255 / s)) << 16) ^ ((i * s) << 8) ^ ((e * s) << 0)
      ),
  },
  l = {
    isPrimitive: !1,
    match: (t) => Object(t) === t,
    fromHexString(t, i, e = 1) {
      const s = n.fromHexString(t);
      (i.r = (((s >> 16) & 255) / 255) * e),
        (i.g = (((s >> 8) & 255) / 255) * e),
        (i.b = ((255 & s) / 255) * e);
    },
    toHexString: ({ r: t, g: i, b: e }, s = 1) =>
      n.toHexString(
        ((t * (s = 255 / s)) << 16) ^ ((i * s) << 8) ^ ((e * s) << 0)
      ),
  },
  o = [s, n, r, l];
class a extends t {
  constructor(t, i, s, n) {
    let r;
    super(t, i, s, 'color'),
      (this.$input = document.createElement('input')),
      this.$input.setAttribute('type', 'color'),
      this.$input.setAttribute('tabindex', -1),
      this.$input.setAttribute('aria-labelledby', this.$name.id),
      (this.$text = document.createElement('input')),
      this.$text.setAttribute('type', 'text'),
      this.$text.setAttribute('spellcheck', 'false'),
      this.$text.setAttribute('aria-labelledby', this.$name.id),
      (this.$display = document.createElement('div')),
      this.$display.classList.add('display'),
      this.$display.appendChild(this.$input),
      this.$widget.appendChild(this.$display),
      this.$widget.appendChild(this.$text),
      (this._format = ((r = this.initialValue), o.find((t) => t.match(r)))),
      (this._rgbScale = n),
      (this._initialValueHexString = this.save()),
      (this._textFocused = !1),
      this.$input.addEventListener('input', () => {
        this._setValueFromHexString(this.$input.value);
      }),
      this.$input.addEventListener('blur', () => {
        this._callOnFinishChange();
      }),
      this.$text.addEventListener('input', () => {
        const t = e(this.$text.value);
        t && this._setValueFromHexString(t);
      }),
      this.$text.addEventListener('focus', () => {
        (this._textFocused = !0), this.$text.select();
      }),
      this.$text.addEventListener('blur', () => {
        (this._textFocused = !1),
          this.updateDisplay(),
          this._callOnFinishChange();
      }),
      (this.$disable = this.$text),
      this.updateDisplay();
  }
  reset() {
    return this._setValueFromHexString(this._initialValueHexString), this;
  }
  _setValueFromHexString(t) {
    if (this._format.isPrimitive) {
      const i = this._format.fromHexString(t);
      this.setValue(i);
    } else
      this._format.fromHexString(t, this.getValue(), this._rgbScale),
        this._callOnChange(),
        this.updateDisplay();
  }
  save() {
    return this._format.toHexString(this.getValue(), this._rgbScale);
  }
  load(t) {
    return this._setValueFromHexString(t), this._callOnFinishChange(), this;
  }
  updateDisplay() {
    return (
      (this.$input.value = this._format.toHexString(
        this.getValue(),
        this._rgbScale
      )),
      this._textFocused || (this.$text.value = this.$input.value.substring(1)),
      (this.$display.style.backgroundColor = this.$input.value),
      this
    );
  }
}
class h extends t {
  constructor(t, i, e) {
    super(t, i, e, 'function'),
      (this.$button = document.createElement('button')),
      this.$button.appendChild(this.$name),
      this.$widget.appendChild(this.$button),
      this.$button.addEventListener('click', (t) => {
        t.preventDefault(), this.getValue().call(this.object);
      }),
      this.$button.addEventListener('touchstart', () => {}),
      (this.$disable = this.$button);
  }
}
class d extends t {
  constructor(t, i, e, s, n, r) {
    super(t, i, e, 'number'), this._initInput(), this.min(s), this.max(n);
    const l = void 0 !== r;
    this.step(l ? r : this._getImplicitStep(), l), this.updateDisplay();
  }
  min(t) {
    return (this._min = t), this._onUpdateMinMax(), this;
  }
  max(t) {
    return (this._max = t), this._onUpdateMinMax(), this;
  }
  step(t, i = !0) {
    return (this._step = t), (this._stepExplicit = i), this;
  }
  updateDisplay() {
    const t = this.getValue();
    if (this._hasSlider) {
      let i = (t - this._min) / (this._max - this._min);
      (i = Math.max(0, Math.min(i, 1))),
        (this.$fill.style.width = 100 * i + '%');
    }
    return this._inputFocused || (this.$input.value = t), this;
  }
  _initInput() {
    (this.$input = document.createElement('input')),
      this.$input.setAttribute('type', 'number'),
      this.$input.setAttribute('step', 'any'),
      this.$input.setAttribute('aria-labelledby', this.$name.id),
      this.$widget.appendChild(this.$input),
      (this.$disable = this.$input);
    const t = (t) => {
      const i = parseFloat(this.$input.value);
      isNaN(i) ||
        (this._snapClampSetValue(i + t), (this.$input.value = this.getValue()));
    };
    let i,
      e,
      s,
      n,
      r,
      l = !1;
    const o = (t) => {
        if (l) {
          const s = t.clientX - i,
            n = t.clientY - e;
          Math.abs(n) > 5
            ? (t.preventDefault(),
              this.$input.blur(),
              (l = !1),
              this._setDraggingStyle(!0, 'vertical'))
            : Math.abs(s) > 5 && a();
        }
        if (!l) {
          const i = t.clientY - s;
          (r -= i * this._step * this._arrowKeyMultiplier(t)),
            n + r > this._max
              ? (r = this._max - n)
              : n + r < this._min && (r = this._min - n),
            this._snapClampSetValue(n + r);
        }
        s = t.clientY;
      },
      a = () => {
        this._setDraggingStyle(!1, 'vertical'),
          this._callOnFinishChange(),
          window.removeEventListener('mousemove', o),
          window.removeEventListener('mouseup', a);
      };
    this.$input.addEventListener('input', () => {
      const t = parseFloat(this.$input.value);
      isNaN(t) || this.setValue(this._clamp(t));
    }),
      this.$input.addEventListener('keydown', (i) => {
        'Enter' === i.code && this.$input.blur(),
          'ArrowUp' === i.code &&
            (i.preventDefault(), t(this._step * this._arrowKeyMultiplier(i))),
          'ArrowDown' === i.code &&
            (i.preventDefault(),
            t(this._step * this._arrowKeyMultiplier(i) * -1));
      }),
      this.$input.addEventListener('wheel', (i) => {
        this._inputFocused &&
          (i.preventDefault(), t(this._step * this._normalizeMouseWheel(i)));
      }),
      this.$input.addEventListener('mousedown', (t) => {
        (i = t.clientX),
          (e = s = t.clientY),
          (l = !0),
          (n = this.getValue()),
          (r = 0),
          window.addEventListener('mousemove', o),
          window.addEventListener('mouseup', a);
      }),
      this.$input.addEventListener('focus', () => {
        this._inputFocused = !0;
      }),
      this.$input.addEventListener('blur', () => {
        (this._inputFocused = !1),
          this.updateDisplay(),
          this._callOnFinishChange();
      });
  }
  _initSlider() {
    (this._hasSlider = !0),
      (this.$slider = document.createElement('div')),
      this.$slider.classList.add('slider'),
      (this.$fill = document.createElement('div')),
      this.$fill.classList.add('fill'),
      this.$slider.appendChild(this.$fill),
      this.$widget.insertBefore(this.$slider, this.$input),
      this.domElement.classList.add('hasSlider');
    const t = (t) => {
        const i = this.$slider.getBoundingClientRect();
        let s, n, r, l, o;
        const e =
          ((s = t),
          (n = i.left),
          (r = i.right),
          (l = this._min),
          (o = this._max),
          ((s - n) / (r - n)) * (o - l) + l);
        this._snapClampSetValue(e);
      },
      i = (i) => {
        t(i.clientX);
      },
      e = () => {
        this._callOnFinishChange(),
          this._setDraggingStyle(!1),
          window.removeEventListener('mousemove', i),
          window.removeEventListener('mouseup', e);
      };
    let s,
      n,
      r = !1;
    const l = (i) => {
        i.preventDefault(),
          this._setDraggingStyle(!0),
          t(i.touches[0].clientX),
          (r = !1);
      },
      o = (i) => {
        if (r) {
          const t = i.touches[0].clientX - s,
            e = i.touches[0].clientY - n;
          Math.abs(t) > Math.abs(e)
            ? l(i)
            : (window.removeEventListener('touchmove', o),
              window.removeEventListener('touchend', a));
        } else i.preventDefault(), t(i.touches[0].clientX);
      },
      a = () => {
        this._callOnFinishChange(),
          this._setDraggingStyle(!1),
          window.removeEventListener('touchmove', o),
          window.removeEventListener('touchend', a);
      },
      h = this._callOnFinishChange.bind(this);
    let d;
    this.$slider.addEventListener('mousedown', (s) => {
      this._setDraggingStyle(!0),
        t(s.clientX),
        window.addEventListener('mousemove', i),
        window.addEventListener('mouseup', e);
    }),
      this.$slider.addEventListener('touchstart', (t) => {
        t.touches.length > 1 ||
          (this._hasScrollBar
            ? ((s = t.touches[0].clientX), (n = t.touches[0].clientY), (r = !0))
            : l(t),
          window.addEventListener('touchmove', o),
          window.addEventListener('touchend', a));
      }),
      this.$slider.addEventListener('wheel', (t) => {
        if (Math.abs(t.deltaX) < Math.abs(t.deltaY) && this._hasScrollBar)
          return;
        t.preventDefault();
        const i = this._normalizeMouseWheel(t) * this._step;
        this._snapClampSetValue(this.getValue() + i),
          (this.$input.value = this.getValue()),
          clearTimeout(d),
          (d = setTimeout(h, 400));
      });
  }
  _setDraggingStyle(t, i = 'horizontal') {
    this.$slider && this.$slider.classList.toggle('active', t),
      document.body.classList.toggle('lil-gui-dragging', t),
      document.body.classList.toggle('lil-gui-' + i, t);
  }
  _getImplicitStep() {
    return this._hasMin && this._hasMax ? (this._max - this._min) / 1e3 : 0.1;
  }
  _onUpdateMinMax() {
    !this._hasSlider &&
      this._hasMin &&
      this._hasMax &&
      (this._stepExplicit || this.step(this._getImplicitStep(), !1),
      this._initSlider(),
      this.updateDisplay());
  }
  _normalizeMouseWheel(t) {
    let { deltaX: i, deltaY: e } = t;
    Math.floor(t.deltaY) !== t.deltaY &&
      t.wheelDelta &&
      ((i = 0), (e = -t.wheelDelta / 120), (e *= this._stepExplicit ? 1 : 10));
    return i + -e;
  }
  _arrowKeyMultiplier(t) {
    let i = this._stepExplicit ? 1 : 10;
    return t.shiftKey ? (i *= 10) : t.altKey && (i /= 10), i;
  }
  _snap(t) {
    const i = Math.round(t / this._step) * this._step;
    return parseFloat(i.toPrecision(15));
  }
  _clamp(t) {
    return (
      t < this._min && (t = this._min), t > this._max && (t = this._max), t
    );
  }
  _snapClampSetValue(t) {
    this.setValue(this._clamp(this._snap(t)));
  }
  get _hasScrollBar() {
    const t = this.parent.root.$children;
    return t.scrollHeight > t.clientHeight;
  }
  get _hasMin() {
    return void 0 !== this._min;
  }
  get _hasMax() {
    return void 0 !== this._max;
  }
}
class c extends t {
  constructor(t, i, e, s) {
    super(t, i, e, 'option'),
      (this.$select = document.createElement('select')),
      this.$select.setAttribute('aria-labelledby', this.$name.id),
      (this.$display = document.createElement('div')),
      this.$display.classList.add('display'),
      (this._values = Array.isArray(s) ? s : Object.values(s)),
      (this._names = Array.isArray(s) ? s : Object.keys(s)),
      this._names.forEach((t) => {
        const i = document.createElement('option');
        (i.innerHTML = t), this.$select.appendChild(i);
      }),
      this.$select.addEventListener('change', () => {
        this.setValue(this._values[this.$select.selectedIndex]),
          this._callOnFinishChange();
      }),
      this.$select.addEventListener('focus', () => {
        this.$display.classList.add('focus');
      }),
      this.$select.addEventListener('blur', () => {
        this.$display.classList.remove('focus');
      }),
      this.$widget.appendChild(this.$select),
      this.$widget.appendChild(this.$display),
      (this.$disable = this.$select),
      this.updateDisplay();
  }
  updateDisplay() {
    const t = this.getValue(),
      i = this._values.indexOf(t);
    return (
      (this.$select.selectedIndex = i),
      (this.$display.innerHTML = -1 === i ? t : this._names[i]),
      this
    );
  }
}
class u extends t {
  constructor(t, i, e) {
    super(t, i, e, 'string'),
      (this.$input = document.createElement('input')),
      this.$input.setAttribute('type', 'text'),
      this.$input.setAttribute('aria-labelledby', this.$name.id),
      this.$input.addEventListener('input', () => {
        this.setValue(this.$input.value);
      }),
      this.$input.addEventListener('keydown', (t) => {
        'Enter' === t.code && this.$input.blur();
      }),
      this.$input.addEventListener('blur', () => {
        this._callOnFinishChange();
      }),
      this.$widget.appendChild(this.$input),
      (this.$disable = this.$input),
      this.updateDisplay();
  }
  updateDisplay() {
    return (this.$input.value = this.getValue()), this;
  }
}
let p = !1;
class g {
  constructor({
    parent: t,
    autoPlace: i = void 0 === t,
    container: e,
    width: s,
    title: n = '3D',
    injectStyles: r = !0,
    touchStyles: l = !0,
  } = {}) {
    if (
      ((this.parent = t),
      (this.root = t ? t.root : this),
      (this.children = []),
      (this.controllers = []),
      (this.folders = []),
      (this._closed = !1),
      (this._hidden = !1),
      (this.domElement = document.createElement('div')),
      this.domElement.classList.add('lil-gui'),
      (this.$title = document.createElement('div')),
      this.$title.classList.add('title'),
      this.$title.setAttribute('role', 'button'),
      this.$title.setAttribute('aria-expanded', !0),
      this.$title.setAttribute('tabindex', 0),
      this.$title.addEventListener('click', () =>
        this.openAnimated(this._closed)
      ),
      this.$title.addEventListener('keydown', (t) => {
        ('Enter' !== t.code && 'Space' !== t.code) ||
          (t.preventDefault(), this.$title.click());
      }),
      this.$title.addEventListener('touchstart', () => {}),
      (this.$children = document.createElement('div')),
      this.$children.classList.add('children'),
      this.domElement.appendChild(this.$title),
      this.domElement.appendChild(this.$children),
      this.title(n),
      l && this.domElement.classList.add('allow-touch-styles'),
      this.parent)
    )
      return (
        this.parent.children.push(this),
        this.parent.folders.push(this),
        void this.parent.$children.appendChild(this.domElement)
      );
    this.domElement.classList.add('root'),
      !p && r && (!(function (t) {})(), (p = !0)),
      e
        ? e.appendChild(this.domElement)
        : i &&
          (this.domElement.classList.add('autoPlace'),
          document.body.appendChild(this.domElement)),
      s && this.domElement.style.setProperty('--width', s + 'px'),
      this.domElement.addEventListener('keydown', (t) => t.stopPropagation()),
      this.domElement.addEventListener('keyup', (t) => t.stopPropagation());
  }
  add(t, e, s, n, r) {
    if (Object(s) === s) return new c(this, t, e, s);
    const l = t[e];
    switch (typeof l) {
      case 'number':
        return new d(this, t, e, s, n, r);
      case 'boolean':
        return new i(this, t, e);
      case 'string':
        return new u(this, t, e);
      case 'function':
        return new h(this, t, e);
    }
    console.error(
      'gui.add failed\n\tproperty:',
      e,
      '\n\tobject:',
      t,
      '\n\tvalue:',
      l
    );
  }
  addColor(t, i, e = 1) {
    return new a(this, t, i, e);
  }
  addFolder(t) {
    return new g({ parent: this, title: t });
  }
  load(t, i = !0) {
    return (
      t.controllers &&
        this.controllers.forEach((i) => {
          i instanceof h ||
            (i._name in t.controllers && i.load(t.controllers[i._name]));
        }),
      i &&
        t.folders &&
        this.folders.forEach((i) => {
          i._title in t.folders && i.load(t.folders[i._title]);
        }),
      this
    );
  }
  save(t = !0) {
    const i = { controllers: {}, folders: {} };
    return (
      this.controllers.forEach((t) => {
        if (!(t instanceof h)) {
          if (t._name in i.controllers)
            throw new Error(
              `Cannot save GUI with duplicate property "${t._name}"`
            );
          i.controllers[t._name] = t.save();
        }
      }),
      t &&
        this.folders.forEach((t) => {
          if (t._title in i.folders)
            throw new Error(
              `Cannot save GUI with duplicate folder "${t._title}"`
            );
          i.folders[t._title] = t.save();
        }),
      i
    );
  }
  open(t = !0) {
    return (
      (this._closed = !t),
      this.$title.setAttribute('aria-expanded', !this._closed),
      this.domElement.classList.toggle('closed', this._closed),
      this
    );
  }
  close() {
    return this.open(!1);
  }
  show(t = !0) {
    return (
      (this._hidden = !t),
      (this.domElement.style.display = this._hidden ? 'none' : ''),
      this
    );
  }
  hide() {
    return this.show(!1);
  }
  openAnimated(t = !0) {
    return (
      (this._closed = !t),
      this.$title.setAttribute('aria-expanded', !this._closed),
      requestAnimationFrame(() => {
        const i = this.$children.clientHeight;
        (this.$children.style.height = i + 'px'),
          this.domElement.classList.add('transition');
        const e = (t) => {
          t.target === this.$children &&
            ((this.$children.style.height = ''),
            this.domElement.classList.remove('transition'),
            this.$children.removeEventListener('transitionend', e));
        };
        this.$children.addEventListener('transitionend', e);
        const s = t ? this.$children.scrollHeight : 0;
        this.domElement.classList.toggle('closed', !t),
          requestAnimationFrame(() => {
            this.$children.style.height = s + 'px';
          });
      }),
      this
    );
  }
  title(t) {
    return (this._title = t), (this.$title.innerHTML = t), this;
  }
  reset(t = !0) {
    return (
      (t ? this.controllersRecursive() : this.controllers).forEach((t) =>
        t.reset()
      ),
      this
    );
  }
  onChange(t) {
    return (this._onChange = t), this;
  }
  _callOnChange(t) {
    this.parent && this.parent._callOnChange(t),
      void 0 !== this._onChange &&
        this._onChange.call(this, {
          object: t.object,
          property: t.property,
          value: t.getValue(),
          controller: t,
        });
  }
  onFinishChange(t) {
    return (this._onFinishChange = t), this;
  }
  _callOnFinishChange(t) {
    this.parent && this.parent._callOnFinishChange(t),
      void 0 !== this._onFinishChange &&
        this._onFinishChange.call(this, {
          object: t.object,
          property: t.property,
          value: t.getValue(),
          controller: t,
        });
  }
  destroy() {
    this.parent &&
      (this.parent.children.splice(this.parent.children.indexOf(this), 1),
      this.parent.folders.splice(this.parent.folders.indexOf(this), 1)),
      this.domElement.parentElement &&
        this.domElement.parentElement.removeChild(this.domElement),
      Array.from(this.children).forEach((t) => t.destroy());
  }
  controllersRecursive() {
    let t = Array.from(this.controllers);
    return (
      this.folders.forEach((i) => {
        t = t.concat(i.controllersRecursive());
      }),
      t
    );
  }
  foldersRecursive() {
    let t = Array.from(this.folders);
    return (
      this.folders.forEach((i) => {
        t = t.concat(i.foldersRecursive());
      }),
      t
    );
  }
}
export default g;
export {
  i as BooleanController,
  a as ColorController,
  t as Controller,
  h as FunctionController,
  g as GUI,
  d as NumberController,
  c as OptionController,
  u as StringController,
};
