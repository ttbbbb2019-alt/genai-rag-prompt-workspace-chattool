// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill for HTMLFormElement.prototype.requestSubmit
// JSDOM doesn't implement this method, so we need to provide a mock
if (!HTMLFormElement.prototype.requestSubmit) {
  HTMLFormElement.prototype.requestSubmit = function(submitter?: HTMLElement) {
    if (submitter && (submitter as any).form !== this) {
      throw new DOMException('The specified element is not a form control.');
    }
    
    // Create and dispatch a submit event
    const event = new Event('submit', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'submitter', { value: submitter });
    
    if (!this.dispatchEvent(event)) {
      return;
    }
    
    // If not prevented, trigger form submission
    this.submit();
  };
}
