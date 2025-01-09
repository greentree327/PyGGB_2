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

interface SkGgbArea extends SkGgbObject {
  ctorPointLabels: Array<string> | null;
  segments: Array<SkObject>;
}

type SkGgbAreaCtorSpec =
  | WrapExistingCtorSpec
  | {
      kind: "points-array";
      points: Array<SkGgbObject>;
    }
  | {
      kind: "conic";
      conic: SkGgbObject
    }
  | {
      kind: "polygon";
      polygon: SkGgbObject
    };

export const register = (mod: any, appApi: AppApi) => {
  const ggb: AugmentedGgbApi = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("Area", {
    constructor: function Area(
      this: SkGgbArea,
      spec: SkGgbAreaCtorSpec
    ) {
      this.ctorPointLabels = null;
      switch (spec.kind) {
        case "points-array": {
          this.ctorPointLabels = spec.points.map((p) => p.$ggbLabel);
          const ggbCmd = assembledCommand("Area", this.ctorPointLabels);
          const lbls = ggb.evalCmd(ggbCmd).split(",");
          // TODO: Should have n.args + 1 labels here; check this.
          this.$ggbLabel = lbls[0];
          this.segments = lbls.slice(1).map(ggb.wrapExistingGgbObject);
          break;
        }
        case "polygon": {
          const ggbCmd = assembledCommand("Area", [
            spec.polygon.$ggbLabel,
          ]);
          const lbls = ggb.evalCmd(ggbCmd).split(",");
          // TODO: Should have n.args + 1 labels here; check this.
          this.$ggbLabel = lbls[0];
          this.segments = lbls.slice(1).map(ggb.wrapExistingGgbObject);
          break;
        }
        default:
          throw new Sk.builtin.RuntimeError(
            `bad Area spec kind "${(spec as any).kind}"`
          );
      }
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "Area() arguments must be" +
            " (iterable_of_points)" +
            " or (Polygon) " +
            " or (Conic)"
        );

        const make = (spec: SkGgbAreaCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.Area(spec), kwargs);

        switch (args.length) {
          case 1: {
            console.log(args[0].tp$name == "Polygon")
            console.log(ggb.isGgbObject(args[0]))
            if (Sk.builtin.checkIterable(args[0])) {
              const points = Sk.misceval.arrayFromIterable(args[0]);
              
              if (ggb.everyElementIsGgbObject(points)) {
                return make({ kind: "points-array", points });
              }
            }
            if (
              ggb.isGgbObject(args[0])
              && args[0].tp$name == "Polygon"
            ) {
              return make({
                kind: "polygon",
                polygon: args[0]
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
      color: ggb.sharedGetSets.color,
      color_floats: ggb.sharedGetSets.color_floats,
      opacity: ggb.sharedGetSets.opacity,
      line_thickness: ggb.sharedGetSets.line_thickness,
      _ggb_type: ggb.sharedGetSets._ggb_type,
      // TODO: List of segments?
    },
  });

  mod.Area = cls;
  registerObjectType("Area", cls);
};
