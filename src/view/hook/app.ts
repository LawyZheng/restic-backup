import { useContext } from "react";
import { App } from 'obsidian';
import { AppContext } from "src/view/view";

export const useApp = (): App | undefined => {
  return useContext(AppContext);
};