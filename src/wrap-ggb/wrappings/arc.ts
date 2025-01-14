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

interface SkGgbArc extends SkGgbObject {
  circleOrEllipse?: SkGgbObject;
  point1?: SkGgbObject;
  point2?: SkGgbObject;
}

type SkGgbArcCtorSpec =
  | WrapExistingCtorSpec
  | {
      kind: "one-circle-two-points";
      circle: SkGgbObject;
      point1: SkGgbObject;
      point2: SkGgbObject;
    }
  | {
        kind: "one-ellipse-two-points";
        ellipse: SkGgbObject;
        point1: SkGgbObject;
        point2: SkGgbObject;
      };

export const register = (mod: any, appApi: AppApi) => {
  const ggb = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("Arc", {
    constructor: function Arc(
      this: SkGgbArc,
      spec: SkGgbArcCtorSpec
    ) {
      const setLabelArgs = setGgbLabelFromArgs(ggb, this, "Arc");

      switch (spec.kind) {
        case "wrap-existing": {
          this.$ggbLabel = spec.label;
          break;
        }
        case "one-circle-two-points": {
          setLabelArgs([spec.circle.$ggbLabel, spec.point1.$ggbLabel, spec.point2.$ggbLabel]);
          this.circleOrEllipse = spec.circle;
          this.point1 = spec.point1;
          this.point2 = spec.point2;

          const ggbCmd = `Arc(${this.circleOrEllipse.$ggbLabel},${this.point1.$ggbLabel},${this.point2.$ggbLabel})`;

          console.log(ggbCmd)

          const lbl = ggb.evalCmd(ggbCmd);
          const distanceValue = ggb.getValue(lbl);
          ggb.deleteObject(lbl);

          return new Sk.builtin.float_(distanceValue);
        }
        case "one-ellipse-two-points": {
            setLabelArgs([spec.ellipse.$ggbLabel, spec.point1.$ggbLabel, spec.point2.$ggbLabel]);
            this.circleOrEllipse = spec.ellipse;
            this.point1 = spec.point1;
            this.point2 = spec.point2;
            
            const ggbCmd = `Arc(${this.circleOrEllipse.$ggbLabel},${this.point1.$ggbLabel},${this.point2.$ggbLabel})`;
  
            const lbl = ggb.evalCmd(ggbCmd);
            const distanceValue = ggb.getValue(lbl);
            ggb.deleteObject(lbl);
            
            return new Sk.builtin.float_(distanceValue);
          }
        default:
          throw new Sk.builtin.TypeError(
            `bad Arc spec kind "${(spec as any).kind}"`
          );
      }
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "Arc() arguments must be (circle, point, point) " +
          "(ellipse, point, point)"
        );

        const make = (spec: SkGgbArcCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.Arc(spec), kwargs);

        switch (args.length) {
          case 3: {
            if (ggb.isGgbObjectOfType(args[1], "point") &&
                ggb.isGgbObjectOfType(args[2], "point")) {
                if (ggb.isGgbObjectOfType(args[0], "circle")) {
                    return make({
                      kind: "one-circle-two-points",
                      circle: args[0],
                      point1: args[1],
                      point2: args[2],
                    });
                } else if (ggb.isGgbObjectOfType(args[0], "ellipse")) {
                    return make({
                        kind: "one-ellipse-two-points",
                        ellipse: args[0],
                        point1: args[1],
                        point2: args[2],
                      });
                }
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
        $get(this: SkGgbArc) {
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

  mod.Arc = cls;
  registerObjectType("arc", cls);
};
