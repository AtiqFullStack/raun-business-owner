import { create } from 'zustand';

type LoaderState = {
  loaders: Record<string, string>;
  showLoader: (text?: string) => string;
  hideLoader: (id: string) => void;
};
let nextId = 0;

// Each operation owns its token: one completed request cannot hide another's loader.
export const useLoader = create<LoaderState>(set => ({
  loaders: {},
  showLoader: (text = 'Loading...') => {
    const id = `loader-${++nextId}`;
    set(state => ({ loaders: { ...state.loaders, [id]: text } }));
    return id;
  },
  hideLoader: id => {
    set(state => {
      if (!(id in state.loaders)) return state;
      const loaders = { ...state.loaders };
      delete loaders[id];
      return { loaders };
    });
  },
}));
