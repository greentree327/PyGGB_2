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

interface SkGgbRigidPolygon extends SkGgbObject {
  input1: Array<string> | null;
  input2?: string;
  input3?: string;
}

type SkGgbRigidPolygonCtorSpec =
  | WrapExistingCtorSpec
  | {
    kind: "polygon";
    polygon: SkGgbObject
  }
  | {
    kind: "polygon-offset";
    polygon: SkGgbObject;
    offset_x: string;
    offset_y: string;
  }  
  | {
    kind: "points-array";
    points: Array<SkGgbObject>;
  };

export const register = (mod: any, appApi: AppApi) => {
  const ggb: AugmentedGgbApi = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("RigidPolygon", {
    constructor: function RigidPolygon(
      this: SkGgbRigidPolygon,
      spec: SkGgbRigidPolygonCtorSpec
    ) {
      this.input1 = null;
      switch (spec.kind) {
        case "points-array": {
          this.input1 = spec.points.map((p) => p.$ggbLabel);
          const ggbCmd = assembledCommand("RigidPolygon", this.input1);
          const lbl = ggb.evalCmd(ggbCmd);
          
          this.$ggbLabel = lbl;
          break;
        }
        case "polygon": {
          const ggbCmd = assembledCommand("RigidPolygon", [
            spec.polygon.$ggbLabel
          ]);
          const lbl = ggb.evalCmd(ggbCmd);
          this.$ggbLabel = lbl;
          break;
        }
        case "polygon-offset": {
          const ggbCmd = assembledCommand("RigidPolygon", [
            spec.polygon.$ggbLabel,
            spec.offset_x,
            spec.offset_y
          ]);
          const lbls = ggb.evalCmd(ggbCmd).split(",");
          // TODO: Should have n.args + 1 labels here; check this.
          this.$ggbLabel = lbls[0];
          break;
        }
        default:
          throw new Sk.builtin.RuntimeError(
            `bad RigidPolygon spec kind "${(spec as any).kind}"`
          );
      }
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "RigidPolygon() arguments must be (Polygon)" +
            " or (Polygon, Offset x, Offset y)" +
            " or (Point, ..., Point)"
        );

        const make = (spec: SkGgbRigidPolygonCtorSpec) => 
          withPropertiesFromNameValuePairs(new mod.RigidPolygon(spec), kwargs);

        switch (args.length) {
          case 1: {
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
          case 2: {
            if (
              ggb.isGgbObject(args[0]) && args[0].tp$name == "Polygon" &&
              typeof args[1] === "string" &&
              typeof args[2] === "string" 
            ) {
              return make({
                kind: "polygon-offset",
                polygon: args[0],
                offset_x: args[1],
                offset_y: args[2],
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

  mod.RigidPolygon = cls;
  registerObjectType("rigid-polygon", cls);
};
