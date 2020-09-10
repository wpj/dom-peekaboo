import debounce from 'lodash.debounce';
import { io, peekaboo, scroll, SetupHandler, Options } from '../../src/index';

// Options to apply to the peekaboo instance attached to box elements at
// specific indices on the test page.
type BoxOptions = {
  [index: number]: Options;
};

export function setup(funcName: string) {
  let offset = {
    x: window.innerWidth,
    y: window.innerHeight,
  };

  let boxOptions: BoxOptions = {
    2: { offsetTop: offset.y, offsetLeft: offset.x },
    7: { offsetBottom: offset.y, offsetRight: offset.x },
  };

  let func: SetupHandler;
  if (funcName === 'io') {
    func = io;
  } else if (funcName === 'scroll') {
    func = scroll;
  } else {
    func = peekaboo;
  }

  Array.from(document.querySelectorAll('.box')).forEach((element, index) => {
    let options = boxOptions[index] || {};
    let onChange = (isIntersecting: boolean) => {
      let text = isIntersecting ? 'visible' : 'hidden';
      element.innerHTML = text;
    };
    func(element as HTMLElement, onChange, options);
  });
}

export function scrollWindow({ x = 0, y = 0 }) {
  window.scrollTo(x, y);
  Promise.resolve();
}

export function waitForIdleCallback() {
  return new Promise((resolve) => {
    // @ts-ignore
    window.requestIdleCallback(resolve);
  });
}

export function waitForScrollStop(debounceTime: number = 0) {
  return new Promise((resolve) => {
    const handleScroll = debounce(() => {
      resolve();
      window.removeEventListener('scroll', handleScroll);
    }, debounceTime);
    window.addEventListener('scroll', handleScroll);
  });
}
