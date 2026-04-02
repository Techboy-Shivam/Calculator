/**
 * TECHBOY CALC — script.js
 * Senior-grade, production-ready calculator logic
 * Full error handling | Keyboard support | Ripple effects | Custom cursor
 */

'use strict';

/* ══════════════════════════════════════════════
   1. CALCULATOR ENGINE
   ══════════════════════════════════════════════ */
class CalculatorEngine {
  constructor() {
    this.expression   = '';   // Raw expression string (what user typed)
    this.displayExpr  = '';   // Formatted expression for top display
    this.displayVal   = '0';  // Large number shown
    this.hasError     = false;
    this.justEvaled   = false; // True right after pressing =
    this.lastChar     = '';   // Tracks last input type for smart logic
    this.decimalCount = 0;    // Decimals in current number segment
  }

  /* ── Helpers ─────────────────────────────── */

  _isOperator(ch) {
    return ['+', '-', '×', '÷', '%'].includes(ch);
  }

  _lastToken() {
    return this.expression.slice(-1);
  }

  _trimTrailingOperator(expr) {
    return expr.replace(/[+\-×÷%\s]+$/, '').trim();
  }

  _currentNumberSegment() {
    // Get the last number token in the expression
    const parts = this.expression.split(/[+\-×÷]/);
    return parts[parts.length - 1] || '';
  }

  _formatResult(num) {
    // Limit to 12 significant figures to avoid floating-point ugliness
    const str = parseFloat(num.toPrecision(12)).toString();
    // If too long, switch to exponential
    if (str.replace('-', '').replace('.', '').length > 12) {
      return parseFloat(num.toPrecision(8)).toExponential();
    }
    return str;
  }

  /* ── Safe Evaluator ──────────────────────── */
  _safeEval(rawExpr) {
    let expr = rawExpr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/%/g, '/100');

    // Guard: only allowed characters
    if (!/^[\d+\-*/().% ]+$/.test(expr)) {
      throw { code: 'SYNTAX',     msg: 'SYNTAX ERROR' };
    }

    // Guard: empty after sanitising
    if (!expr.trim()) {
      throw { code: 'EMPTY',      msg: 'NOTHING TO CALC' };
    }

    // Guard: trailing operator (e.g. "5+", "3×")
    if (/[+\-*/% ]$/.test(expr.trim())) {
      throw { code: 'INCOMPLETE', msg: 'INCOMPLETE EXPR' };
    }

    // Guard: leading non-minus operator (e.g. "×5", "/5")
    if (/^[*/% ]/.test(expr.trim())) {
      throw { code: 'SYNTAX',     msg: 'SYNTAX ERROR' };
    }

    // Guard: consecutive operators (e.g. "5++3", "5**2")
    // Allow double minus handled before this point
    if (/[+\-*/]{2,}/.test(expr)) {
      // Allow only "+-" or "-" following another operator (e.g. 5 + -3)
      const cleaned = expr.replace(/([+\-*/])\s*-(?=[\d(])/g, '$1(-');
      if (/[+\-*/]{2,}/.test(cleaned)) {
        throw { code: 'SYNTAX',   msg: 'SYNTAX ERROR' };
      }
      expr = cleaned;
    }

    // Guard: division by zero (integer 0 after /)
    // Use a regex that avoids false positive for 0.5 etc.
    if (/\/\s*0(?![\d.])/.test(expr)) {
      throw { code: 'DIV0',       msg: 'DIV BY ZERO' };
    }

    let result;
    try {
      // eslint-disable-next-line no-new-func
      result = Function('"use strict"; return (' + expr + ')')();
    } catch (e) {
      throw { code: 'SYNTAX',     msg: 'SYNTAX ERROR' };
    }

    if (typeof result !== 'number') {
      throw { code: 'TYPE',       msg: 'TYPE ERROR' };
    }
    if (!isFinite(result) && result === Infinity) {
      throw { code: 'OVERFLOW',   msg: 'OVERFLOW' };
    }
    if (!isFinite(result) && result === -Infinity) {
      throw { code: 'UNDERFLOW',  msg: 'UNDERFLOW' };
    }
    if (isNaN(result)) {
      throw { code: 'NAN',        msg: 'UNDEFINED' };
    }
    if (Math.abs(result) > 9.999999999e14) {
      throw { code: 'OVERFLOW',   msg: 'OVERFLOW' };
    }

    return result;
  }

  /* ── Input Handlers ──────────────────────── */


// inputNumber(digit) {
//   if (this.hasError) { this.clear(); }

//   // FIX: If user types a number immediately after '=', start a fresh calculation
//   if (this.justEvaled) {
//     this.expression = '';
//     this.displayExpr = '';
//     this.justEvaled = false;
//     this.decimalCount = 0;
//   }

//   const seg = this._currentNumberSegment();
  
//   // Prevent leading double-zero
//   if (seg === '0' && digit === '0') return { ok: false };
  
//   // Replace lone '0' with the new digit (e.g., typing '5' turns '0' into '5')
//   if (seg === '0' && digit !== '.') {
//     this.expression = this.expression.slice(0, -1);
//   }

//   this.expression += digit;
//   this.displayVal = this._currentNumberSegment();
//   this.lastChar = 'number';
//   return { ok: true };
// }

inputNumber(digit) {
    if (this.hasError) { this.clear(); }

    // HIGHLIGHT: Reset expression if a number is pressed immediately after '='
    if (this.justEvaled) {
      this.expression  = '';
      this.displayExpr = '';
      this.justEvaled  = false;
    }

    const seg = this._currentNumberSegment();
    
    // Prevent "00" and replace leading "0" (e.g., '0' -> '5' instead of '05')
    if (seg === '0' && digit === '0') return;
    if (seg === '0' && digit !== '.') {
      this.expression = this.expression.slice(0, -1);
    }

    this.expression += digit;
    this.displayVal  = this._currentNumberSegment();
    this.lastChar    = 'number';
    return { ok: true };
  }

inputOperator(op) {
    if (this.hasError) { this.clear(); }

    const last = this._lastToken();

    // 1. Prevent starting with an operator (except minus for negative numbers)
    if (this.expression === "" || this.expression === "0") {
      if (op === '-') {
        this.expression = '-';
        this.displayVal = '-';
        this.lastChar = 'operator';
        return { ok: true };
      }
      return { ok: false };
    }

    // 2. Logic: If last char is an operator, REPLACE it instead of stacking
    if (this._isOperator(last)) {
      // Check if we are trying to replace a standalone minus at the start
      if (this.expression === '-') {
          if (op === '-') return { ok: true }; // Already a minus, do nothing
          this.expression = ''; // Clear it so we don't have a leading * or /
          return { ok: false };
      }
      
      // Standard replacement: "1 + " becomes "1 * " when * is pressed
      this.expression = this.expression.slice(0, -1) + op;
    } else {
      // 3. Normal append if the last character was a number
      this.expression += op;
    }

    this.displayVal    = this.expression;
    this.decimalCount  = 0; 
    this.justEvaled    = false;
    this.lastChar      = 'operator';
    return { ok: true };
  }
  inputDecimal() {
    if (this.hasError) { this.clear(); }

    if (this.justEvaled) {
      this.expression   = '0';
      this.displayExpr  = '';
      this.justEvaled   = false;
      this.decimalCount = 0;
    }

    const seg = this._currentNumberSegment();

    // Prevent multiple decimals in one number
    if (seg.includes('.')) return { ok: false };

    if (seg === '' || this._isOperator(this._lastToken())) {
      this.expression += '0';
    }

    this.expression   += '.';
    this.displayVal    = this._currentNumberSegment();
    this.lastChar      = 'decimal';
    return { ok: true };
  }



  toggleSign() {
  if (this.hasError || this.expression === '') return;

  // If toggling right after a result, treat the result as the new segment
  if (this.justEvaled) {
    let val = parseFloat(this.expression);
    if (isNaN(val)) return;
    this.expression = this._formatResult(val * -1);
    this.displayVal = this.expression;
    this.displayExpr = ''; // Clear "ans =" view
    this.justEvaled = false; // We are now editing the number
    return;
  }

  const seg = this._currentNumberSegment();
  if (!seg || seg === '-') return;

  // Find the start index of the last number segment
  const idx = this.expression.lastIndexOf(seg);
  
  // Check if there is a minus sign immediately before the segment
  const beforeSeg = this.expression.substring(idx - 1, idx);
  
  if (beforeSeg === '-') {
    // If it was negative, we need to check if that '-' was an operator or a sign
    // Logic: if it's the very start of the string or preceded by another operator, it's a sign
    const beforeMinus = this.expression.substring(idx - 2, idx - 1);
    if (idx === 1 || this._isOperator(beforeMinus)) {
      // It's a negative number; make it positive by removing the '-'
      this.expression = this.expression.slice(0, idx - 1) + seg;
      this.displayVal = seg;
      return;
    }
  }

  // Otherwise, make it negative
  this.expression = this.expression.slice(0, idx) + '-' + seg;
  this.displayVal = '-' + seg;
}

/* ── Percent Logic ───────────────────────── */
  percent() {
    if (this.hasError || this.expression === '') return { ok: false };

    const seg = this._currentNumberSegment();
    
    // If no number segment exists or the last char is an operator, skip
    if (!seg || this._isOperator(this._lastToken())) return { ok: false };

    const val = parseFloat(seg);
    if (isNaN(val)) return { ok: false };

    // Math logic: convert number to a percentage (e.g., 50 becomes 0.5)
    const percentVal = val / 100;
    const formatted = this._formatResult(percentVal);

    // Replace the specific number segment in the expression string
    const idx = this.expression.lastIndexOf(seg);
    this.expression = this.expression.slice(0, idx) + formatted;
    
    this.displayVal = formatted;
    this.lastChar = 'number';
    return { ok: true };
  }

  backspace() {
    if (this.hasError) { this.clear(); return; }
    if (this.justEvaled) { this.clear(); return; }
    if (this.expression.length === 0) return;

    const removed = this._lastToken();
    this.expression = this.expression.slice(0, -1);

    // Re-sync decimal counter
    if (removed === '.') this.decimalCount = 0;

    // Re-sync display value
    const seg = this._currentNumberSegment();
    this.displayVal = seg || (this.expression === '' ? '0' : this.expression.slice(-1));

    this.lastChar = '';
    return { ok: true };
  }

  clear() {
    this.expression   = '';
    this.displayExpr  = '';
    this.displayVal   = '0';
    this.hasError     = false;
    this.justEvaled   = false;
    this.lastChar     = '';
    this.decimalCount = 0;
    return { ok: true };
  }

  equals() {
    if (this.hasError) { this.clear(); return { ok: true }; }
    if (this.expression === '' || this.expression === '-') {
      return { ok: false, error: { code: 'EMPTY', msg: 'NOTHING TO CALC' } };
    }

    try {
      const result     = this._safeEval(this.expression);
      const formatted  = this._formatResult(result);

      this.displayExpr = this.expression + ' =';
      this.expression  = formatted;
      this.displayVal  = formatted;
      this.justEvaled  = true;
      this.lastChar    = 'result';
      this.decimalCount = formatted.includes('.') ? 1 : 0;

      return { ok: true, result: formatted };
    } catch (err) {
      this.hasError = true;
      return { ok: false, error: err };
    }
  }

  getState() {
    return {
      displayVal:  this.displayVal  || '0',
      displayExpr: this.displayExpr || this.expression,
      hasError:    this.hasError,
    };
  }
}


/* ══════════════════════════════════════════════
   2. UI CONTROLLER
   ══════════════════════════════════════════════ */
class UIController {
  constructor(engine) {
    this.engine   = engine;
    this.elements = {
      valueDisplay:      document.getElementById('valueDisplay'),
      expressionDisplay: document.getElementById('expressionDisplay'),
      errorDisplay:      document.getElementById('errorDisplay'),
      displayPanel:      document.getElementById('displayPanel'),
      calcContainer:     document.getElementById('calcContainer'),
      brandStatus:       document.getElementById('brandStatus'),
    };
    this._errorTimeout = null;
    this._activeOpBtn  = null;
  }

  /* ── Render State ────────────────────────── */
  render(animateValue = false) {
    const { displayVal, displayExpr, hasError } = this.engine.getState();

    // Expression (top small text)
    this.elements.expressionDisplay.textContent = displayExpr;

    // Main value
    const prev = this.elements.valueDisplay.textContent;
    this.elements.valueDisplay.textContent = hasError ? displayVal : displayVal;

    if (animateValue && prev !== displayVal) {
      this.elements.valueDisplay.classList.remove('value-updated');
      // Trigger reflow for re-animation
      void this.elements.valueDisplay.offsetWidth;
      this.elements.valueDisplay.classList.add('value-updated');
    }
  }

  showError(errorObj) {
    const msg = errorObj?.msg || 'ERROR';

    this.elements.valueDisplay.textContent = '— — —';
    this.elements.errorDisplay.textContent = msg;
    this.elements.errorDisplay.classList.add('visible');
    this.elements.displayPanel.classList.add('has-error', 'error-glow');
    this.elements.calcContainer.classList.add('error-flash');
    this.elements.brandStatus.textContent = 'ERROR';
    this.elements.brandStatus.classList.add('error-status');

    if (this._errorTimeout) clearTimeout(this._errorTimeout);
    this._errorTimeout = setTimeout(() => this.clearError(), 2800);
  }

  clearError() {
    this.elements.errorDisplay.textContent = '';
    this.elements.errorDisplay.classList.remove('visible');
    this.elements.displayPanel.classList.remove('has-error', 'error-glow');
    this.elements.calcContainer.classList.remove('error-flash');
    this.elements.brandStatus.textContent = 'READY';
    this.elements.brandStatus.classList.remove('error-status');
  }

  highlightOperator(btn) {
    if (this._activeOpBtn) {
      this._activeOpBtn.classList.remove('active-op');
    }
    if (btn) {
      btn.classList.add('active-op');
      this._activeOpBtn = btn;
    } else {
      this._activeOpBtn = null;
    }
  }

  clearOperatorHighlight() {
    if (this._activeOpBtn) {
      this._activeOpBtn.classList.remove('active-op');
      this._activeOpBtn = null;
    }
  }

  triggerRipple(btn, event) {
    const ripple = btn.querySelector('.btn-ripple');
    if (!ripple) return;

    const rect   = btn.getBoundingClientRect();
    const x      = (event?.clientX ?? rect.left + rect.width / 2) - rect.left;
    const y      = (event?.clientY ?? rect.top  + rect.height / 2) - rect.top;
    const size   = Math.max(rect.width, rect.height) * 1.6;

    ripple.style.width    = size + 'px';
    ripple.style.height   = size + 'px';
    ripple.style.left     = (x - size / 2) + 'px';
    ripple.style.top      = (y - size / 2) + 'px';

    ripple.classList.remove('ripple-active');
    void ripple.offsetWidth;
    ripple.classList.add('ripple-active');

    ripple.addEventListener('animationend', () => {
      ripple.classList.remove('ripple-active');
    }, { once: true });
  }

  /* ── Adaptive font size for long numbers ── */
  adaptFontSize() {
    const val    = this.elements.valueDisplay.textContent;
    const length = val.replace(/[^0-9.e]/g, '').length;

    let size;
    if (length <= 9)       size = 'clamp(32px, 8vw, 48px)';
    else if (length <= 12) size = 'clamp(24px, 6vw, 36px)';
    else                   size = 'clamp(18px, 4.5vw, 26px)';

    this.elements.valueDisplay.style.fontSize = size;
  }
}


/* ══════════════════════════════════════════════
   3. INPUT CONTROLLER
   ══════════════════════════════════════════════ */
class InputController {
  constructor(engine, ui) {
    this.engine = engine;
    this.ui     = ui;
    this._init();
  }

  _init() {
    this._bindButtons();
    this._bindKeyboard();
  }

  /* ── Button Clicks ───────────────────────── */
  _bindButtons() {
    const grid = document.querySelector('.btn-grid');
    if (!grid) return;

    grid.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      this._handleButton(btn, e);
    });

    // Hover tracking for cursor
    grid.addEventListener('pointerenter', (e) => {
      if (e.target.closest('.btn')) {
        document.body.classList.add('btn-hover');
      }
    }, true);

    grid.addEventListener('pointerleave', (e) => {
      if (e.target.closest('.btn')) {
        document.body.classList.remove('btn-hover');
      }
    }, true);
  }

  _handleButton(btn, event) {
    const action = btn.dataset.action;
    const value  = btn.dataset.value;

    // Ripple first (instant visual feedback)
    this.ui.triggerRipple(btn, event);

    switch (action) {
      case 'number':
        this._handleNumber(value);
        break;
      case 'operator':
        this._handleOperator(value, btn);
        break;
      case 'decimal':
        this._handleDecimal();
        break;
      case 'clear':
        this._handleClear();
        break;
      case 'backspace':
        this._handleBackspace();
        break;
      case 'percent':
        this._handlePercent();
        break;
      case 'toggle-sign':
        this._handleToggleSign();
        break;
      case 'equals':
        this._handleEquals();
        break;
    }
  }

  _handleNumber(digit) {
    this.engine.inputNumber(digit);
    this.ui.clearError();
    if (this.engine.justEvaled === false) this.ui.clearOperatorHighlight();
    const state = this.engine.getState();
    this.ui.elements.valueDisplay.textContent = state.displayVal;
    this.ui.elements.expressionDisplay.textContent = state.displayExpr || this.engine.expression;
    this.ui.adaptFontSize();
  }

  _handleOperator(op, btn) {
    const result = this.engine.inputOperator(op);
    if (result && !result.ok) return;
    this.ui.clearError();
    this.ui.highlightOperator(btn);
    const state = this.engine.getState();
    this.ui.elements.expressionDisplay.textContent = this.engine.expression;
    this.ui.elements.valueDisplay.textContent = state.displayVal;
    this.ui.adaptFontSize();
  }

  _handleDecimal() {
    const result = this.engine.inputDecimal();
    if (result && !result.ok) return; // Already has decimal — silently ignore
    this.ui.clearError();
    const state = this.engine.getState();
    this.ui.elements.valueDisplay.textContent = state.displayVal;
    this.ui.elements.expressionDisplay.textContent = this.engine.expression;
    this.ui.adaptFontSize();
  }

  _handleClear() {
    this.engine.clear();
    this.ui.clearError();
    this.ui.clearOperatorHighlight();
    this.ui.elements.valueDisplay.textContent = '0';
    this.ui.elements.expressionDisplay.textContent = '';
    this.ui.elements.valueDisplay.style.fontSize = '';
    this.ui.elements.brandStatus.textContent = 'READY';
    this.ui.elements.brandStatus.classList.remove('error-status');
  }

  _handleBackspace() {
    this.engine.backspace();
    this.ui.clearError();
    const state = this.engine.getState();
    this.ui.elements.valueDisplay.textContent = state.displayVal;
    this.ui.elements.expressionDisplay.textContent = this.engine.expression;
    this.ui.adaptFontSize();
  }

  _handlePercent() {
    this.engine.percent();
    this.ui.clearError();
    const state = this.engine.getState();
    this.ui.elements.valueDisplay.textContent = state.displayVal;
    this.ui.elements.expressionDisplay.textContent = state.displayExpr || this.engine.expression;
    this.ui.adaptFontSize();
  }

  _handleToggleSign() {
    this.engine.toggleSign();
    const state = this.engine.getState();
    this.ui.elements.valueDisplay.textContent = state.displayVal;
    this.ui.elements.expressionDisplay.textContent = state.displayExpr || this.engine.expression;
    this.ui.adaptFontSize();
  }

  _handleEquals() {
    const result = this.engine.equals();
    this.ui.clearOperatorHighlight();

    if (result.ok) {
      this.ui.clearError();
      const state = this.engine.getState();
      this.ui.elements.expressionDisplay.textContent = state.displayExpr;
      this.ui.elements.valueDisplay.textContent = state.displayVal;

      // Animate result
      this.ui.elements.valueDisplay.classList.remove('value-updated');
      void this.ui.elements.valueDisplay.offsetWidth;
      this.ui.elements.valueDisplay.classList.add('value-updated');
      this.ui.adaptFontSize();
    } else {
      this.ui.showError(result.error);
    }
  }

  /* ── Keyboard Support ────────────────────── */
  _bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      this._routeKey(e);
    });
  }

  _routeKey(e) {
    const keyMap = {
      '0': () => this._triggerBtn('[data-value="0"]', () => this._handleNumber('0')),
      '1': () => this._triggerBtn('[data-value="1"]', () => this._handleNumber('1')),
      '2': () => this._triggerBtn('[data-value="2"]', () => this._handleNumber('2')),
      '3': () => this._triggerBtn('[data-value="3"]', () => this._handleNumber('3')),
      '4': () => this._triggerBtn('[data-value="4"]', () => this._handleNumber('4')),
      '5': () => this._triggerBtn('[data-value="5"]', () => this._handleNumber('5')),
      '6': () => this._triggerBtn('[data-value="6"]', () => this._handleNumber('6')),
      '7': () => this._triggerBtn('[data-value="7"]', () => this._handleNumber('7')),
      '8': () => this._triggerBtn('[data-value="8"]', () => this._handleNumber('8')),
      '9': () => this._triggerBtn('[data-value="9"]', () => this._handleNumber('9')),
      '+': () => this._triggerBtn('[data-value="+"]', () => this._handleOperatorKey('+')),
      '-': () => this._triggerBtn('[data-value="-"]', () => this._handleOperatorKey('-')),
      '*': () => this._triggerBtn('[data-value="×"]', () => this._handleOperatorKey('×')),
      '/': () => { e.preventDefault(); this._triggerBtn('[data-value="÷"]', () => this._handleOperatorKey('÷')); },
      '%': () => this._triggerBtn('[data-action="percent"]', () => this._handlePercent()),
      '.': () => this._triggerBtn('[data-action="decimal"]', () => this._handleDecimal()),
      ',': () => this._triggerBtn('[data-action="decimal"]', () => this._handleDecimal()),
      'Enter':     () => this._triggerBtn('[data-action="equals"]',    () => this._handleEquals()),
      '=':         () => this._triggerBtn('[data-action="equals"]',    () => this._handleEquals()),
      'Backspace':  () => this._triggerBtn('[data-action="backspace"]', () => this._handleBackspace()),
      'Delete':     () => this._triggerBtn('[data-action="clear"]',    () => this._handleClear()),
      'Escape':     () => this._triggerBtn('[data-action="clear"]',    () => this._handleClear()),
      'c':          () => this._triggerBtn('[data-action="clear"]',    () => this._handleClear()),
      'C':          () => this._triggerBtn('[data-action="clear"]',    () => this._handleClear()),
    };

    const handler = keyMap[e.key];
    if (handler) {
      e.preventDefault();
      handler();
    }
  }

  _handleOperatorKey(op) {
    const btn = document.querySelector(`[data-value="${op}"]`);
    this._handleOperator(op, btn);
  }

  _triggerBtn(selector, action) {
    const btn = document.querySelector(selector);
    if (btn) {
      this.ui.triggerRipple(btn, null);
      btn.classList.add('keyboard-focus');
      setTimeout(() => btn.classList.remove('keyboard-focus'), 200);
    }
    action();
  }
}


/* ══════════════════════════════════════════════
   4. CUSTOM CURSOR
   ══════════════════════════════════════════════ */
class CustomCursor {
  constructor() {
    this.dot  = document.getElementById('cursorDot');
    this.ring = document.getElementById('cursorRing');
    this.ringX = 0; this.ringY = 0;
    this.dotX  = 0; this.dotY  = 0;
    this._init();
  }

  _init() {
    // Only activate on non-touch devices
    if (window.matchMedia('(hover: none)').matches) return;

    let ringX = 0, ringY = 0;
    let reqId = null;

    const updateRing = () => {
      ringX += (this.dotX - ringX) * 0.12;
      ringY += (this.dotY - ringY) * 0.12;
      this.ring.style.transform = `translate(calc(-50% + ${ringX}px), calc(-50% + ${ringY}px))`;
      reqId = requestAnimationFrame(updateRing);
    };

    document.addEventListener('mousemove', (e) => {
      this.dotX = e.clientX;
      this.dotY = e.clientY;
      this.dot.style.transform = `translate(calc(-50% + ${e.clientX}px), calc(-50% + ${e.clientY}px))`;
    }, { passive: true });

    reqId = requestAnimationFrame(updateRing);
  }
}


/* ══════════════════════════════════════════════
   5. SELF-TEST SUITE
   (Runs silently at startup, logs to console)
   ══════════════════════════════════════════════ */
function runTests() {
  const eng = new CalculatorEngine();

  const tests = [
    // Basic arithmetic
    { desc: '2 + 2 = 4',               expr: '2+2',          expect: '4' },
    { desc: '10 - 3 = 7',              expr: '10-3',         expect: '7' },
    { desc: '6 × 7 = 42',             expr: '6×7',          expect: '42' },
    { desc: '9 ÷ 3 = 3',             expr: '9÷3',          expect: '3' },
    { desc: '0.1 + 0.2 ≈ 0.3',        expr: '0.1+0.2',      expect: '0.3' },
    { desc: '100 ÷ 4 = 25',           expr: '100÷4',        expect: '25' },
    { desc: '-5 + 10 = 5',             expr: '-5+10',        expect: '5' },
    { desc: '50% = 0.5',               expr: '50%',         expect: '0.5' },


    // Edge: trailing operator
    { desc: '1 + = ERR:INCOMPLETE',    expr: '1+',           expectErr: 'INCOMPLETE' },
    { desc: '5 × = ERR:INCOMPLETE',    expr: '5×',           expectErr: 'INCOMPLETE' },

    // Edge: div by zero
    { desc: '5 ÷ 0 = ERR:DIV0',      expr: '5÷0',          expectErr: 'DIV0' },
    { desc: '1 ÷ 0 = ERR:DIV0',      expr: '1÷0',          expectErr: 'DIV0' },

    // Edge: syntax
    { desc: '× 5 = ERR:SYNTAX',        expr: '×5',           expectErr: 'SYNTAX' },
  ];

  let passed = 0; let failed = 0;
  const results = [];

  tests.forEach(t => {
    eng.clear();
    const chars = t.expr.split('');

    chars.forEach(ch => {
      if (/\d/.test(ch))         eng.inputNumber(ch);
      else if (ch === '+')       eng.inputOperator('+');
      else if (ch === '-')       eng.inputOperator('-');
      else if (ch === '×')       eng.inputOperator('×');
      else if (ch === '÷')       eng.inputOperator('÷');
      else if (ch === '.')       eng.inputDecimal();
    });

    const res = eng.equals();

    if (t.expectErr) {
      const gotErr = !res.ok && res.error?.code === t.expectErr;
      if (gotErr) { passed++; results.push(`✅ PASS: ${t.desc}`); }
      else        { failed++; results.push(`❌ FAIL: ${t.desc} | got ${JSON.stringify(res)}`); }
    } else {
      if (res.ok && res.result === t.expect) {
        passed++; results.push(`✅ PASS: ${t.desc}`);
      } else {
        failed++; results.push(`❌ FAIL: ${t.desc} | expected ${t.expect}, got ${res.result}`);
      }
    }
  });

  console.groupCollapsed(`%c TECHBOY CALC — Test Suite: ${passed}/${tests.length} passed`, 'color:#06b6d4;font-weight:bold;font-size:13px');
  results.forEach(r => console.log(r));
  if (failed > 0) console.warn(`${failed} test(s) FAILED`);
  console.groupEnd();

  return { passed, failed, total: tests.length };
}


/* ══════════════════════════════════════════════
   6. BOOTSTRAP
   ══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Run self-tests first
  const testResults = runTests();
  if (testResults.failed > 0) {
    console.error('[TECHBOY CALC] ⚠️  Some tests failed. Check test output above.');
  }

  // Boot the app
  const engine = new CalculatorEngine();
  const ui     = new UIController(engine);
  const input  = new InputController(engine, ui);
  const cursor = new CustomCursor();

  // Initial render
  ui.render(false);

  console.log('%c TECHBOY CALC v1.0 — Booted successfully 🚀', 'color:#f59e0b;font-weight:bold;font-size:13px');

  // Expose for debugging (dev only — remove in strict production)
  if (typeof window !== 'undefined') {
    window.__TECHBOYCalc = { engine, ui };
  }
});
