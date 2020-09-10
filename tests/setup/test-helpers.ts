import { join as pathJoin, parse as pathParse, sep as pathSep } from 'path';

import type { Page } from 'playwright';
import { rollup, OutputAsset, OutputChunk } from 'rollup';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

const extensions = ['.js', '.ts'];

function isOutputChunk(
  chunkOrAsset: OutputChunk | OutputAsset,
): chunkOrAsset is OutputChunk {
  return chunkOrAsset.type === 'chunk';
}

export async function bundle({
  input,
  name,
}: {
  input: string;
  name: string;
}): Promise<string> {
  const bundle = await rollup({
    input,
    plugins: [
      babel({
        extensions,
        babelHelpers: 'bundled',
      }),
      commonjs({ extensions }),
      resolve({ extensions }),
    ],
  });

  const { output } = await bundle.generate({
    format: 'iife',
    name,
  });

  return output
    .filter(isOutputChunk)
    .map((chunk) => chunk.code)
    .join('\n');
}

function pathToName(path: string) {
  const parsed = pathParse(path);

  return pathJoin(parsed.dir, parsed.name)
    .replace(new RegExp(pathSep, 'g'), '__')
    .replace(/-/g, '_');
}

type Module = {
  [functionName: string]: (...args: any[]) => any;
};

export type AsyncProxy<T extends Module> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>;
};

interface Context {
  name: string;
  args: any[];
  property: string;
}

export async function proxy<Mod extends Module>(
  path: string,
  page: Page,
): Promise<AsyncProxy<Mod>> {
  let name = pathToName(path);
  let script = await bundle({ input: path, name });
  await page.addScriptTag({ content: script });

  return new Proxy(
    {},
    {
      get(target: any, property: string) {
        // await calls promise methods on awaited values, so we can't proxy those.
        if (
          property === 'then' ||
          property === 'catch' ||
          property === 'finally'
        ) {
          return target[property];
        }

        return (...args: any[]) => {
          let c: Context = { name, args, property };
          return page.evaluate((context: Context) => {
            // @ts-ignore
            let Namespace = window[context.name];

            return Namespace[context.property](...context.args);
          }, c);
        };
      },
    },
  );
}
