import { AppApi } from "../shared/appApi";
import { SkulptApi } from "../shared/vendor-types/skulptapi";

declare var Sk: SkulptApi;

export const register = (mod: any, appApi: AppApi) => {
  const uiApi = appApi.ui;
  const ggb = appApi.ggb;

  const fun = new Sk.builtin.func((...args) => {
    if (args.length !== 0)
      throw new Sk.builtin.TypeError("bad getBase64() args; need 0 args");
    return new Sk.builtin.str(ggb.getBase64());
  });

  mod.getBase64 = fun;
};
