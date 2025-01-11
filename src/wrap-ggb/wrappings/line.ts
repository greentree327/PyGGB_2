import { AppApi } from "../../shared/appApi";
import {
  augmentedGgbApi,
  setGgbLabelFromArgs,
  setGgbLabelFromCmd,
  SkGgbObject,
  withPropertiesFromNameValuePairs,
  WrapExistingCtorSpec,
} from "../shared";
import { SkObject, SkulptApi } from "../../shared/vendor-types/skulptapi";

import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

interface SkGgbLine extends SkGgbObject {}

type SkGgbLineCtorSpec = // defines a typescript union type that specifies the valid ways to construct a SkGgbLine object
  | WrapExistingCtorSpec
  | { kind: "point-point"; points: Array<SkGgbObject> } 
  | { kind: "label-point-point"; points: Array<SkGgbObject>; label:string } 
  | { kind: "coefficients"; coeffs: [SkObject, SkObject] };

export const register = (mod: any, appApi: AppApi) => {
  const ggb = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("Line", {
    constructor: function Line(this: SkGgbLine, spec: SkGgbLineCtorSpec) {
      const setLabelCmd = setGgbLabelFromCmd(ggb, this);
      const setLabelArgs = setGgbLabelFromArgs(ggb, this, "Line");

      switch (spec.kind) {
        case "wrap-existing": {
          this.$ggbLabel = spec.label;
          return;
        }
        case "point-point": {
          setLabelArgs(spec.points.map((p) => p.$ggbLabel));
          return;
        }
        case "label-point-point": {
          const label = spec.label; // 
          const pointsLabels = spec.points.map((p) => p.$ggbLabel);
          const fullCommand = `${label} = Line[${pointsLabels.join(", ")}]`; // "AB = Line[A, B]"
          setLabelCmd(fullCommand);  
          return;
        }
        case "coefficients": {
          const ggbCoeffs = spec.coeffs.map(ggb.numberValueOrLabel);
          setLabelCmd(`y=(${ggbCoeffs[0]})x + (${ggbCoeffs[1]})`);
          return;
        }
        default:
          throw new Sk.builtin.RuntimeError(
            `bad Line spec kind "${(spec as any).kind}"`
          );
      }
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "Line() arguments must be (point, point) or (slope, intercept)"
        );
 
        const make = (spec: SkGgbLineCtorSpec) => // spec: parameter of the make function
          withPropertiesFromNameValuePairs(new mod.Line(spec), kwargs); // apply the withPropertiesFromNameValuePairs function to the newly created Line function

        switch (args.length) {
          case 3: { // Label + two points
            if (Sk.builtin.checkString(args[0]))  // Check if first argument is a string (label)
            {
                const label = args[0].v; // Extract user-defined label
                const points = args.slice(1);
                if (ggb.everyElementIsGgbObjectOfType(points, "point")){
                  return make({
                    kind: "label-point-point",
                    points: points,
                    label: label, // Pass user-defined label to Line constructor
                  });
                }
                throw badArgsError;
                
            }
            throw badArgsError;
        }
          case 2: {
            if (ggb.everyElementIsGgbObjectOfType(args, "point")) {
              // return new Sk.builtin.list(args);
              return make({ kind: "point-point", points: args }); // args = [Point(1, 2), Point(3, 4)]
            }

            if (args.every(ggb.isPythonOrGgbNumber)) {
              // We know that args is a two-element array of SkObjects,
              // but TypeScript can't yet work that out.
              return make({
                kind: "coefficients",
                coeffs: args as [SkObject, SkObject],
              });
            }

            throw badArgsError;
          }
          default:
            throw badArgsError;
        }
      },
    },
    methods: {
      ...ggb.freeCopyMethodsSlice,
    },
    getsets: {
      is_visible: ggb.sharedGetSets.is_visible,
      color: ggb.sharedGetSets.color,
      color_floats: ggb.sharedGetSets.color_floats,
      line_thickness: ggb.sharedGetSets.line_thickness,
      _ggb_type: ggb.sharedGetSets._ggb_type,
      _ggb_exists: ggb.sharedGetSets._ggb_exists,
    },
  });

  mod.Line = cls;
  registerObjectType("line", cls);
};
