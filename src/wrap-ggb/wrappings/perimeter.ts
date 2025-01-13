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
import { METHODS } from "http";

declare var Sk: SkulptApi;

interface SkGgbPerimeter extends SkGgbObject {
  circle: SkGgbObject
}

type SkGgbPerimeterCtorSpec =
  | WrapExistingCtorSpec
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

  const cls = Sk.abstr.buildNativeClass("Perimeter", {
    constructor: function Perimeter(
      this: SkGgbPerimeter,
      spec: SkGgbPerimeterCtorSpec
    ) {
      switch (spec.kind) {
        case "polygon": {
          const ggbCmd = assembledCommand("Perimeter", [spec.polygon.$ggbLabel]);
          const lbls = ggb.evalCmd(ggbCmd);
          const PerimeterValue = ggb.getValue(lbls);
          ggb.deleteObject(lbls);
          
          // TODO: Should have n.args + 1 labels here; check this.
          this.$ggbLabel = lbls.split(",")[0];
          return new Sk.builtin.float_(PerimeterValue);
        }
        case "conic": {
          const ggbCmd = assembledCommand("Perimeter", [
            spec.conic.$ggbLabel,
          ]);
          const lbls = ggb.evalCmd(ggbCmd);
          const PerimeterValue = ggb.getValue(lbls);
          ggb.deleteObject(lbls);
          
          // TODO: Should have n.args + 1 labels here; check this.
          this.$ggbLabel = lbls.split(",")[0];
          return new Sk.builtin.float_(PerimeterValue);
        }
        default:
          throw new Sk.builtin.RuntimeError(
            `bad Perimeter spec kind "${(spec as any).kind}"`
          );
      }
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "Perimeter() arguments must (Polygon) " +
            "or (Conic)"
        );

        const make = (spec: SkGgbPerimeterCtorSpec) => 
          withPropertiesFromNameValuePairs(new mod.Perimeter(spec), kwargs);

        switch (args.length) {
          case 1: {
            if (ggb.isGgbObject(args[0])
              && args[0].tp$name == "Polygon") {
              return make({ kind: "polygon", polygon: args[0] });
            }
            if (ggb.isGgbObjectOfType(args[0], "conic") ||
              ggb.isGgbObjectOfType(args[0], "circle")) {
              return make({ kind: "conic", conic: args[0] });
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

  mod.Perimeter = cls;
  registerObjectType("perimeter", cls);
};
