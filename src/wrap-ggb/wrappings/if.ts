import { AppApi } from "../../shared/appApi";
import { augmentedGgbApi } from "../shared";
import { SkulptApi } from "../../shared/vendor-types/skulptapi";

declare var Sk: SkulptApi;

export const register = (mod: any, appApi: AppApi) => {
  const ggb = augmentedGgbApi(appApi.ggb);

  const fun = new Sk.builtin.func((...args) => {
    // TODO: Allow literals as well?
    if (!ggb.everyElementIsGgbObject(args)) {
      console.error(args);
      throw new Sk.builtin.TypeError("all args must be GGB objects");
    }

    const ggbArgs = args.map((obj) => obj.$ggbLabel).join(","); // iterates through each object in args, map each object to its $ggbLabel, return a new array of $ggbLabels, combine the array of labels into string
    const ggbCmd = `If(${ggbArgs})`;
    const label = ggb.evalCmd(ggbCmd);
    return ggb.wrapExistingGgbObject(label);
  });

  mod.If = fun;
};
