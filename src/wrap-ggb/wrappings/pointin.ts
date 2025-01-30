import { AppApi } from "../../shared/appApi";
import {
  augmentedGgbApi,
  withPropertiesFromNameValuePairs,
  SkGgbObject,
  SpecConstructible,
  setGgbLabelFromCmd,
} from "../shared";
import { SkulptApi } from "../../shared/vendor-types/skulptapi";
import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

// Define the interface for the PointIn object
interface SkGgbPointIn extends SkGgbObject {
  region: SkGgbObject;
}

// Define the constructor specification for the PointIn object
type SkGgbPointInCtorSpec = {
  kind: "basic";
  region: SkGgbObject;
} | {
  kind: "labeled";
  label: string;
  region: SkGgbObject;
};

export const register = (
  mod: { PointIn: SpecConstructible<SkGgbPointInCtorSpec, SkGgbPointIn> },
  appApi: AppApi
) => {
  const ggb = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("PointIn", {
    constructor: function PointIn(this: SkGgbPointIn, spec: SkGgbPointInCtorSpec) {
      const setLabelCmd = setGgbLabelFromCmd(ggb, this);
      let ggbCmd: string;

      switch (spec.kind) {
        case "basic": {
          // Handle PointIn(region)
          ggbCmd = `PointIn(${spec.region.$ggbLabel})`;
          break;
        }
        case "labeled": {
          // Handle PointIn(label, region)
          this.$ggbLabel = spec.label;
          ggbCmd = `${spec.label} = PointIn(${spec.region.$ggbLabel})`;
          break;
        }
        default:
          throw new Sk.builtin.TypeError(
            `Unknown PointIn spec kind: ${(spec as any).kind}`
          );
      }

      // Set the GeoGebra label and evaluate the command
      setLabelCmd(ggbCmd, { allowNullLabel: false });

      // Register update handlers
      this.$updateHandlers = [];
      ggb.registerObjectUpdateListener(this.$ggbLabel, () =>
        this.$fireUpdateEvents()
      );

      // Wrap and return the created GeoGebra object
      const label = ggb.evalCmd(ggbCmd);
      return ggb.wrapExistingGgbObject(label);
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "PointIn() arguments must be (region) or (label, region)"
        );

        const make = (spec: SkGgbPointInCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.PointIn(spec), kwargs);

        switch (args.length) {
          case 1: {
            // Handle PointIn(region)
            if (ggb.isGgbObject(args[0])) {
              return make({ kind: "basic", region: args[0] });
            }
            throw badArgsError;
          }
          case 2: {
            // Handle PointIn(label, region)
            if (
              Sk.builtin.checkString(args[0]) &&
              ggb.isGgbObject(args[1])
            ) {
              const label = args[0].v;
              return make({ kind: "labeled", label, region: args[1] });
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
        $meth(this: SkGgbPointIn, pyFun: any) {
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

  mod.PointIn = cls;
  registerObjectType("point_in", cls);
};