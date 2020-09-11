# dom-peekaboo

[![CI Status](https://github.com/wpj/dom-peekaboo/workflows/CI/badge.svg)](https://github.com/wpj/dom-peekaboo/actions)

Functions for tracking a DOM node's intersection with the viewport.

## Installation

```
npm install dom-peekaboo
```

## Usage

```js
import { peekaboo } from 'dom-peekaboo';

function onChange(isIntersecting) {
  console.log(
    `Element is ${isIntersecting ? 'visible' : 'not visible'} in the viewport`,
  );
}

peekaboo(document.getElementById('test'), onChange);
```

## API

### Parameters

All functions accept the same set of parameters with the following type:

```typescript
(
  element: HTMLElement,
  onChange: (isIntersecting: boolean) => void,
  options?: Options,
) => () => void;
```

The following options are available:

- `offsetBottom?: number`: Number of pixels to add to the bottom of the area
  checked against when computing element intersection. (default: `0`)

- `offsetLeft?: number`: Number of pixels to add to the left of the area checked
  against when computing element intersection. (default: `0`)

- `offsetRight?: number`: Number of pixels to add to the right of the area
  checked against when computing element intersection. (default: `0`)

- `offsetTop?: number`: Number of pixels to add to the top of the area checked
  against when computing element intersection. (default: `0`)

- `throttle?: number`: Number of ms to throttle scroll events (only applies in
  environments that don't support IntersectionObserver or when using
  `useScrollIntersection`/`useScrollIntersectionChangeCallback`). (default:
  `100`)

### Exports

- `io`: Uses an IntersectionObserver to trigger `onChange` when `element` enters
  or exits the viewport.

- `scroll`: Uses a scroll event listener, `getBoundingClientRect`, and
  ResizeObserver to trigger `onChange` when `element` enters or exits the
  viewport.

- `peekaboo`: Uses `io` to trigger `onChange` in browsers that support
  IntersectionObserver and falls back to using `scroll` in browsers that don't.

## Caveats

- This module considers edge-adjacent intersections (when the target element is
  directly above/below/beside the viewport) to be in viewport. If you only want
  to consider elements with pixels in the viewport as visible, you can configure
  `offsetBottom`/`offsetLeft`/`offsetRight`/`offsetTop` to be `-1`.
- IntersectionObserver ignores `rootMargin` in iframe contexts, which means that
  offsets will be ignored.
  - https://w3c.github.io/IntersectionObserver/#dom-intersectionobserver-rootmargin
  - https://developers.google.com/web/updates/2016/04/intersectionobserver#iframe_magic
