/**
 * Animation utilities
 */

/** Easing: easeOutQuart */
export function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

/** Easing: easeOutExpo */
export function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Animate a numeric value and update an element.
 * @param {HTMLElement} element
 * @param {number} from
 * @param {number} to
 * @param {number} duration - ms
 * @param {(value: number) => string} formatter
 * @param {Function} [easingFn]
 */
export function animateValue(element, from, to, duration, formatter, easingFn = easeOutQuart) {
  let startTimestamp = null;

  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const val = from + (to - from) * easingFn(progress);
    element.innerHTML = formatter(val);
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

/**
 * Apply stagger animations to a list of elements.
 * @param {HTMLElement[]} elements
 * @param {string} animationClass
 * @param {number} delayStep - ms between each element
 */
export function stagger(elements, animationClass = 'animate-in', delayStep = 50) {
  elements.forEach((el, i) => {
    el.style.animationDelay = `${i * delayStep}ms`;
    el.classList.add(animationClass);
  });
}

/**
 * Wait for a specified duration.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
