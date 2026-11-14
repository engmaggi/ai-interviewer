
import "@testing-library/jest-dom";

// Add PointerEvent support for components that use Base UI.
if (!window.PointerEvent) {
  window.PointerEvent = MouseEvent;
}
