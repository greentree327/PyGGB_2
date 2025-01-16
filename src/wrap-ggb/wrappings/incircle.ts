import { AppApi } from "../../shared/appApi";
import {
  augmentedGgbApi,
  withPropertiesFromNameValuePairs,
  WrapExistingCtorSpec,
  SkGgbObject,
  AugmentedGgbApi,
  assembledCommand,
} from "../shared";
import {
  KeywordArgsArray,
  SkObject,
  SkulptApi,
} from "../../shared/vendor-types/skulptapi";
import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

// TODO: If we pass an explicit list of points, we get a GGB object with
// type like "quadrilateral" or "pentagon".  Haven't tested to see how
// far this goes.  What are the consequences for, e.g., wrap-existing?

interface SkGgbPolygon extends SkGgbObject {
  point1: SkGgbObject;
  point2: SkGgbObject;
  point3: SkGgbObject;
}

type SkGgbPolygonCtorSpec =
  | WrapExistingCtorSpec
  | {
      kind: "three-points";
      point1: SkGgbObject;
      point2: SkGgbObject;
      point3: SkGgbObject;
    };

export const register = (mod: any, appApi: AppApi) => {
  const ggb: AugmentedGgbApi = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("Incircle", {
    constructor: function Incircle(
      this: SkGgbPolygon,
      spec: SkGgbPolygonCtorSpec
    ) {
      switch (spec.kind) {
        case "three-points": {
          const ggbCmd = assembledCommand("Incircle", [
            spec.point1.$ggbLabel,
            spec.point2.$ggbLabel,
            spec.point3.$ggbLabel
          ]);
          const lbls = ggb.evalCmd(ggbCmd);
          // TODO: Should have n.args + 1 labels here; check this.
          this.$ggbLabel = lbls;
          break;
        }
        
        default:
          throw new Sk.builtin.RuntimeError(
            `bad Incircle spec kind "${(spec as any).kind}"`
          );
      }
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "Incircle() arguments must be (point, point, point)"
        );

        const make = (spec: SkGgbPolygonCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.Incircle(spec), kwargs);

        switch (args.length) {
          case 3: {
            if (ggb.everyElementIsGgbObjectOfType(args, "point")) {
                return make({ 
                  kind: "three-points", 
                  point1: args[0],
                  point2: args[1],
                  point3: args[2],
                 });
            }

            throw badArgsError;
          }
          default:
            throw badArgsError;
        }
      },
    },
    getsets: {
      is_visible: ggb.sharedGetSets.is_visible,
      with_label: ggb.sharedGetSets.label_visible,
      color: ggb.sharedGetSets.color,
      color_floats: ggb.sharedGetSets.color_floats,
      opacity: ggb.sharedGetSets.opacity,
      line_thickness: ggb.sharedGetSets.line_thickness,
      _ggb_type: ggb.sharedGetSets._ggb_type,
      // TODO: List of segments?
    },
  });

  mod.Incircle = cls;
  registerObjectType("incircle", cls);
};
