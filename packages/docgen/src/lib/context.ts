import { getContext, setContext } from 'svelte';
import type { Registry } from './registry.ts';

const REGISTRY_KEY = Symbol('docgen:registry');

export const setDocgenRegistry = (registry: Registry): void => {
  setContext(REGISTRY_KEY, registry);
};

export const useDocgenRegistry = (): Registry => {
  const reg = getContext<Registry | undefined>(REGISTRY_KEY);
  if (!reg) {
    throw new Error(
      'docgen: no Registry in context. Wrap your app with <DocgenProvider registry={...}> or call setDocgenRegistry(...) in a parent layout.'
    );
  }
  return reg;
};

export const tryDocgenRegistry = (): Registry | undefined => {
  return getContext<Registry | undefined>(REGISTRY_KEY);
};
