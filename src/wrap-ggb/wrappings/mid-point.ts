import { AppApi } from "../../shared/appApi";
import {
  augmentedGgbApi,
  throwIfNotNumber,
  withPropertiesFromNameValuePairs,
  SkGgbObject,
  WrapExistingCtorSpec,
  throwIfLabelNull,
  SpecConstructible,
  setGgbLabelFromArgs,
  setGgbLabelFromCmd,
} from "../shared";
import { SkObject, SkulptApi } from "../../shared/vendor-types/skulptapi";

import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

interface SkGgbMidPoint extends SkGgbObject {
  object: SkGgbObject;
  point2?: SkGgbObject;
}

type SkGgbMidPointCtorSpec =
  | WrapExistingCtorSpec
  | {
      kind: "segment";
      segment: SkGgbObject;
    }
  | {
      kind: "interval";
      interval: SkGgbObject;
    }
  | {
      kind: "conic";
      conic: SkGgbObject;
    }
  | {
      kind: "quadric";
      quadric: SkGgbObject;
    }
  | {
      kind: "two-points";
      point1: SkGgbObject;
      point2: SkGgbObject;
    }
  ;

export const register = (
  mod: { MidPoint: SpecConstructible<SkGgbMidPointCtorSpec, SkGgbMidPoint> },
  appApi: AppApi
) => {
  const ggb = augmentedGgbApi(appApi.ggb);
  const skApi = appApi.sk;

  const cls = Sk.abstr.buildNativeClass("MidPoint", {
    constructor: function MidPoint(this: SkGgbMidPoint, spec: SkGgbMidPointCtorSpec) {
      const setLabelCmd = setGgbLabelFromCmd(ggb, this);

      switch (spec.kind) {
        case "wrap-existing": {
          this.$ggbLabel = spec.label;
          break;
        }
        case "segment": {
          setLabelCmd(spec.segment.$ggbLabel);

          const ggbCmd = `Midpoint(${spec.segment.$ggbLabel})`;
          ggb.evalCmd(ggbCmd);
          
          break;
        }
        case "conic": {
          setLabelCmd(spec.conic.$ggbLabel);

          const ggbCmd = `Midpoint(${spec.conic.$ggbLabel})`;
          ggb.evalCmd(ggbCmd);
          
          break;
        }
        case "interval": {
          setLabelCmd(spec.interval.$ggbLabel);

          const ggbCmd = `Midpoint(${spec.interval.$ggbLabel})`;
          ggb.evalCmd(ggbCmd);
          
          break;
        }
        case "quadric": {
          setLabelCmd(spec.quadric.$ggbLabel);

          const ggbCmd = `Midpoint(${spec.quadric.$ggbLabel})`;
          ggb.evalCmd(ggbCmd);
          
          break;
        }
        case "two-points": {
          setLabelCmd(`(${spec.point1.$ggbLabel},${spec.point2.$ggbLabel})`);
          
          const ggbCmd = `Midpoint(${spec.point1.$ggbLabel},${spec.point2.$ggbLabel})`;
          ggb.evalCmd(ggbCmd);
          
          
          break;
        }
        default:
          throw new Sk.builtin.TypeError(
            `bad MidPoint spec kind "${(spec as any).kind}"`
          );
      }

      this.$updateHandlers = [];
      ggb.registerObjectUpdateListener(this.$ggbLabel, () =>
        this.$fireUpdateEvents()
      );
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "MidPoint() arguments must be (segment) or " +
            "(conic) or (quadric) or" +
            " (interval) or (point, point)"
        );

        const make = (spec: SkGgbMidPointCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.MidPoint(spec), kwargs);

        switch (args.length) {
          case 1: {
            if (ggb.isGgbObjectOfType(args[0], "segment")) {
              return make({ kind: "segment", segment: args[0] });
            } else if (ggb.isGgbObjectOfType(args[0], "conic")) {
              return make({ kind: "conic", conic: args[0] });
            } else if (ggb.isGgbObjectOfType(args[0], "interval")) {
              return make({ kind: "interval", interval: args[0] });
            } else if (ggb.isGgbObjectOfType(args[0], "quadric")) {
              return make({ kind: "quadric", quadric: args[0] });
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
          default:
            throw badArgsError;
        }
      },
      ...ggb.sharedOpSlots,
    },
    methods: {
      when_moved: {
        $meth(this: SkGgbMidPoint, pyFun: any) {
          this.$updateHandlers.push(pyFun);
          return pyFun;
        },
        $flags: { OneArg: true },
      },
      ...ggb.withPropertiesMethodsSlice,
      ...ggb.freeCopyMethodsSlice,
      ...ggb.deleteMethodsSlice,
    },
    getsets: {
      is_visible: ggb.sharedGetSets.is_visible,
      with_label: ggb.sharedGetSets.label_visible,
      is_independent: ggb.sharedGetSets.is_independent,
      color: ggb.sharedGetSets.color,
      color_floats: ggb.sharedGetSets.color_floats,
      size: ggb.sharedGetSets.size,
      _ggb_type: ggb.sharedGetSets._ggb_type,
    },
  });

  mod.MidPoint = cls;
  registerObjectType("MidPoint", cls);
};
