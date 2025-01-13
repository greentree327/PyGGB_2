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

interface SkGgbCircumference extends SkGgbObject {
  circle: SkGgbObject
}

type SkGgbCircumferenceCtorSpec =
  | WrapExistingCtorSpec
  | {
      kind: "conic";
      conic: SkGgbObject
    }
  | {
      kind: "circle";
      circle: SkGgbObject
    };

export const register = (mod: any, appApi: AppApi) => {
  const ggb: AugmentedGgbApi = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("Circumference", {
    constructor: function Circumference(
      this: SkGgbCircumference,
      spec: SkGgbCircumferenceCtorSpec
    ) {
      switch (spec.kind) {
        case "circle": {
          const ggbCmd = assembledCommand("Circumference", [spec.circle.$ggbLabel]);
          const lbls = ggb.evalCmd(ggbCmd);
          const CircumferenceValue = ggb.getValue(lbls);
          ggb.deleteObject(lbls);
          
          // TODO: Should have n.args + 1 labels here; check this.
          this.$ggbLabel = lbls.split(",")[0];
          return new Sk.builtin.float_(CircumferenceValue);
        }
        case "conic": {
          const ggbCmd = assembledCommand("Circumference", [
            spec.conic.$ggbLabel,
          ]);
          const lbls = ggb.evalCmd(ggbCmd);
          const CircumferenceValue = ggb.getValue(lbls);
          ggb.deleteObject(lbls);
          
          // TODO: Should have n.args + 1 labels here; check this.
          this.$ggbLabel = lbls.split(",")[0];
          return new Sk.builtin.float_(CircumferenceValue);
        }
        default:
          throw new Sk.builtin.RuntimeError(
            `bad Circumference spec kind "${(spec as any).kind}"`
          );
      }
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "Circumference() arguments must be (Circle) " +
            "or (Conic)"
        );

        const make = (spec: SkGgbCircumferenceCtorSpec) => 
          withPropertiesFromNameValuePairs(new mod.Circumference(spec), kwargs);

        switch (args.length) {
          case 1: {
            if (ggb.isGgbObjectOfType(args[0], "circle")) {
              return make({ kind: "circle", circle: args[0] });
            }
            if (ggb.isGgbObjectOfType(args[0], "conic")) {
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

  mod.Circumference = cls;
  registerObjectType("Circumference", cls);
};
