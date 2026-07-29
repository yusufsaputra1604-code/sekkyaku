import { create } from 'zustand';

const useThemeStore = create((set) => ({
  dark: localStorage.getItem('theme') === 'dark',

  toggle: () => {
    set((state) => {
      const newDark = !state.dark;
      localStorage.setItem('theme', newDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newDark);
      return { dark: newDark };
    });
  },

  init: () => {
    const dark = localStorage.getItem('theme') === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    set({ dark });
  },
}));

export default useThemeStore;
