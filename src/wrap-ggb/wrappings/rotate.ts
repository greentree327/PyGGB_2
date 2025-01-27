import { AppApi } from "../../shared/appApi";
import { augmentedGgbApi, assembledCommand,SkGgbObject, AugmentedGgbApi } from "../shared";
import { SkulptApi } from "../../shared/vendor-types/skulptapi";

declare var Sk: SkulptApi;

export const register = (mod: any, appApi: AppApi) => {
  const ggb: AugmentedGgbApi = augmentedGgbApi(appApi.ggb);

  const fun = new Sk.builtin.func((...args) => {
    const badArgsError = new Sk.builtin.TypeError(
      "Rotate() arguments must be" +
        " (object, angle)" +
        " or (object, angle, rotation_center_point)" +
        " (label, object, angle, rotation_center_point)"
      );

    const ggbRotate = (extraArgs: Array<string>, labelArg?: string) => {

      const objIndex = labelArg ? 1 : 0;

      // Narrow the type of args[objIndex] to SkGgbObject
      if (!ggb.isGgbObject(args[objIndex])) {
        throw badArgsError;
      }
      const objectArg = (args[objIndex] as SkGgbObject).$ggbLabel; // Assert type here

      // const objectArg = args[labelArg? 1 : 0].$ggbLabel;
      const pyAngle = args[labelArg? 2 : 1]; // If label is present, angle = args[2]; else angle = args[1]
      ggb.throwIfNotPyOrGgbNumber(pyAngle, "rotation angle");
      const anglestring = ggb.numberValueOrLabel(pyAngle);
      const anglenumber = ggb.getValue(anglestring);
      let anglenumber_degree = anglenumber * (Math.PI / 180);
      let angleArg: string = anglenumber_degree.toString();
      // const ggbArgs = [args[0].$ggbLabel, angleArg, ...extraArgs];
      // const objectArg = args[labelArg? 1 : 0].$ggbLabel;
      const ggbArgs = [objectArg, angleArg, ...extraArgs];

      let ggbCmd;
      if (labelArg) {
        ggbCmd = `${labelArg} = ${assembledCommand("Rotate", ggbArgs)}`;
      } else {
        ggbCmd = assembledCommand("Rotate", ggbArgs);
      }
      
      const label = ggb.evalCmd(ggbCmd);
      return ggb.wrapExistingGgbObject(label);
      /*
      // Wrap the object and return it
      const rotatedObject = ggb.wrapExistingGgbObject(label);

      // Get the coordinates of the rotated object
      const xCoord = ggb.getXcoord(label);
      const yCoord = ggb.getYcoord(label);

      // Return the rotated object and its coordinates
      return new Sk.builtin.tuple([
        rotatedObject,
        new Sk.builtin.float_(xCoord),
        new Sk.builtin.float_(yCoord),
      ]);
      */
    };

    switch (args.length) {
      case 2: {
        return ggbRotate([]);
      }
      case 3: {
        if (!ggb.isGgbObjectOfType(args[2], "point")) {
          throw badArgsError;
        }
        return ggbRotate([args[2].$ggbLabel]);
      }
      case 4: {
        // (label, object, angle, rotation_center_point)
        if (!Sk.builtin.checkString(args[0])) {
          throw badArgsError;
        }
        if (!ggb.isGgbObjectOfType(args[3], "point")) {
          throw badArgsError;
        }

        const label = args[0].v; // Extract the label as a string
        return ggbRotate([args[3].$ggbLabel], label);
      }

      default:
        throw badArgsError;
    }
  });


  mod.Rotate = fun;
};
