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

interface SkGgbPerpendicularBisector extends SkGgbObject {
  input1: SkGgbObject;
  input2?: SkGgbObject;
  input3?: SkGgbObject;
}

type SkGgbPerpendicularBisectorCtorSpec =
  | WrapExistingCtorSpec
  | {
      kind: "segment";
      segment: SkGgbObject;
    }
  |  {
      kind: "two-points";
      point1: SkGgbObject;
      point2: SkGgbObject;
    }
  |  {
      kind: "two-points-direction";
      point1: SkGgbObject;
      point2: SkGgbObject;
      direction: any;
  };

export const register = (mod: any, appApi: AppApi) => {
  const ggb = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("PerpendicularBisector", {
    constructor: function PerpendicularBisector(
      this: SkGgbPerpendicularBisector,
      spec: SkGgbPerpendicularBisectorCtorSpec
    ) {
      const setLabelArgs = setGgbLabelFromArgs(ggb, this, "PerpendicularBisector");

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
        case "segment": {
          setLabelArgs([spec.segment.$ggbLabel]);
          this.input1 = spec.segment;
          break;
        }
        case "two-points": {
          setLabelArgs([spec.point1.$ggbLabel, spec.point2.$ggbLabel]);
          this.input1 = spec.point1;
          this.input2 = spec.point2;
          break;
        }
        case "two-points-direction": {
          setLabelArgs([spec.point1.$ggbLabel, spec.point2.$ggbLabel]);
          this.input1 = spec.point1;
          this.input2 = spec.point2;
          this.input3 = spec.direction;
          break;
        }
        default:
          throw new Sk.builtin.TypeError(
            `bad PerpendicularBisector spec kind "${(spec as any).kind}"`
          );
      }
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "PerpendicularBisector() arguments must be (segment) or " +
          "(point, point) or (point, point, direction)"
        );

        const make = (spec: SkGgbPerpendicularBisectorCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.PerpendicularBisector(spec), kwargs);

        switch (args.length) {
          case 1: {
            if (ggb.everyElementIsGgbObjectOfType(args, "segment")) {
              return make({
                kind: "segment",
                segment: args[0]
              });
            }

            throw badArgsError;
          }
          case 2: {
            if (ggb.everyElementIsGgbObjectOfType(args, "point")) {
              return make({
                kind: "two-points",
                point1: args[0],
                point2: args[1]
              });
            }

            throw badArgsError;
          }
          case 3: {
            if (ggb.isGgbObjectOfType(args[0], "point") &&
                ggb.isGgbObjectOfType(args[1], "point") &&
                (ggb.isGgbObjectOfType(args[2], "line") ||
                ggb.isGgbObjectOfType(args[2], "axis") ||
                ggb.isGgbObjectOfType(args[2], "segment"))
            ) {
              return make({
                kind: "two-points-direction",
                point1: args[0],
                point2: args[1],
                direction: args[2]
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
        $get(this: SkGgbPerpendicularBisector) {
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

  mod.PerpendicularBisector = cls;
  registerObjectType("perpendicularbisector", cls);
};
