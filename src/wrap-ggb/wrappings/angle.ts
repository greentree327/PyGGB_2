import { AppApi } from "../../shared/appApi";
import {
  augmentedGgbApi,
  withPropertiesFromNameValuePairs,
  SkGgbObject,
  WrapExistingCtorSpec,
  SpecConstructible,
  setGgbLabelFromCmd,
  assembledCommand,
} from "../shared";
import { SkulptApi } from "../../shared/vendor-types/skulptapi";
import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

interface SkGgbAngle extends SkGgbObject {
  object1?: SkGgbObject;
  object2?: SkGgbObject;
  object3?: SkGgbObject;
  unit?: "degrees" | "radians";
}

type SkGgbAngleCtorSpec =
  | WrapExistingCtorSpec
  | {
      kind: "three-points";
      point1: SkGgbObject;
      apex: SkGgbObject;
      point2: SkGgbObject;
    }
  | {
      kind: "two-lines";
      object1: SkGgbObject;
      object2: SkGgbObject;
    };

export const register = (
  mod: { Angle: SpecConstructible<SkGgbAngleCtorSpec, SkGgbAngle> },
  appApi: AppApi
) => {
  const ggb = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("Angle", {
    constructor: function Angle(this: SkGgbAngle, spec: SkGgbAngleCtorSpec) {
      const setLabelCmd = setGgbLabelFromCmd(ggb, this);
      let ggbCmd: string;

      switch (spec.kind) {
        case "three-points": {
          ggbCmd = assembledCommand("Angle", [
            spec.point1.$ggbLabel,
            spec.apex.$ggbLabel,
            spec.point2.$ggbLabel,
          ]);
          
          break;
        }
        case "two-lines": {
          ggbCmd = assembledCommand("Angle", [
            spec.object1.$ggbLabel,
            spec.object2.$ggbLabel,
          ]);

          break;
        }
        default:
          throw new Sk.builtin.TypeError(
            `Invalid Angle spec kind: ${(spec as any).kind}`
          );
      }

      // Set the label, allowing null results
      setLabelCmd(ggbCmd, { allowNullLabel: true });
      // Register update handlers
      this.$updateHandlers = [];
      ggb.registerObjectUpdateListener(this.$ggbLabel, () =>
        this.$fireUpdateEvents()
      );

      const lbls = ggb.evalCmd(ggbCmd);
      const angle = ggb.getValue(lbls);
      ggb.deleteObject(lbls);

      // Convert angle to degrees and limit precision
      const angleInDegrees = Number((angle * 180 / Math.PI).toPrecision(10));
      // Return the precise angle
      return new Sk.builtin.float_(angleInDegrees);
      
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "Angle() arguments must be (point1, apex, point2) or (line1, line2)."
        );

        const make = (spec: SkGgbAngleCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.Angle(spec), kwargs);

        if (args.length === 3 && ggb.everyElementIsGgbObjectOfType(args, "point")) {
          return make({
            kind: "three-points",
            point1: args[0],
            apex: args[1],
            point2: args[2],
          });
        } else if (args.length === 2 && ggb.everyElementIsGgbObject(args)) {
          return make({
            kind: "two-lines",
            object1: args[0],
            object2: args[1],
          });
        }

        throw badArgsError;
      },
      ...ggb.sharedOpSlots,
    },
    methods: {
      when_moved: {
        $meth(this: SkGgbAngle, pyFun: any) {
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
      color: ggb.sharedGetSets.color,
      color_floats: ggb.sharedGetSets.color_floats,
      _ggb_type: ggb.sharedGetSets._ggb_type,
      size: ggb.sharedGetSets.size,
      caption: ggb.sharedGetSets.caption,
      opacity: ggb.sharedGetSets.opacity,
    },
  });

  mod.Angle = cls;
  registerObjectType("angle", cls);
};