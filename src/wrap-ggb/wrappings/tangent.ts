import { AppApi } from "../../shared/appApi";
import {
  augmentedGgbApi,
  withPropertiesFromNameValuePairs,
  WrapExistingCtorSpec,
  SkGgbObject,
  setGgbLabelFromArgs,
} from "../shared";
import { SkulptApi } from "../../shared/vendor-types/skulptapi";

import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

interface SkGgbTangent extends SkGgbObject {
  input1: SkGgbObject;
  input2: SkGgbObject;
}

type SkGgbTangentCtorSpec =
  | WrapExistingCtorSpec
  | {
      kind: "point-curve";
      point: SkGgbObject;
      curve: SkGgbObject;
    }
  |  {
      kind: "two-circles";
      circle1: SkGgbObject;
      circle2: SkGgbObject;
  };

export const register = (mod: any, appApi: AppApi) => {
  const ggb = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("Tangent", {
    constructor: function Tangent(
      this: SkGgbTangent,
      spec: SkGgbTangentCtorSpec
    ) {
      const setLabelArgs = setGgbLabelFromArgs(ggb, this, "Tangent");

      switch (spec.kind) {
        case "wrap-existing": {
          this.$ggbLabel = spec.label;
          // TODO: Can we reliably parse ggbApi.getDefinitionString() output to
          // recover the two points?  Do we need to keep a registry of which GGB
          // objects we have already wrapped for Python use?
          //
          // Can get from GGB with Point(SEGMENT, 0) and Point(SEGMENT, 1).
          break;
        }
        case "point-curve": {
          setLabelArgs([spec.point.$ggbLabel, spec.curve.$ggbLabel]);
          this.input1 = spec.point;
          this.input2 = spec.curve;
          break;
        }
        case "two-circles": {
          setLabelArgs([spec.circle1.$ggbLabel, spec.circle2.$ggbLabel]);
          this.input1 = spec.circle1;
          this.input2 = spec.circle2;
          break;
        }
        default:
          throw new Sk.builtin.TypeError(
            `bad Tangent spec kind "${(spec as any).kind}"`
          );
      }
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "Tangent() arguments must be (point, curve) or (circle, circle)"
        );

        const make = (spec: SkGgbTangentCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.Tangent(spec), kwargs);

        switch (args.length) {
          case 2: {
            if (ggb.isGgbObjectOfType(args[0], "point") &&
                (
                  ggb.isGgbObjectOfType(args[1], "parabola") ||
                  ggb.isGgbObjectOfType(args[1], "circle") 
                )
              ) {
              return make({
                kind: "point-curve",
                point: args[0],
                curve: args[1],
              });
            }

            if (ggb.everyElementIsGgbObjectOfType(args, "circle")) {
              return make({
                kind: "two-circles",
                circle1: args[0],
                circle2: args[1]
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
      // "length" is reserved word for Skulpt, so the property must be
      // set up with this mangled name:
      length_$rw$: {
        $get(this: SkGgbTangent) {
          return new Sk.builtin.float_(ggb.getValue(this.$ggbLabel));
        },
      },
      is_visible: ggb.sharedGetSets.is_visible,
      color: ggb.sharedGetSets.color,
      color_floats: ggb.sharedGetSets.color_floats,
      line_thickness: ggb.sharedGetSets.line_thickness,
      _ggb_type: ggb.sharedGetSets._ggb_type,
    },
  });

  mod.Tangent = cls;
  registerObjectType("tangent", cls);
};
