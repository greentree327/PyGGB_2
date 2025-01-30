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
import { SkObject,SkulptApi } from "../../shared/vendor-types/skulptapi";

import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

interface SkGgbFunction extends SkGgbObject {
  // $setInterval(this: SkGgbFunction, startX: number, endX: number): void;
  // $expression(this: SkGgbFunction): string;
}

type SkGgbFunctionCtorSpec =
  | WrapExistingCtorSpec
  | {
    kind: "equation";
    expr: string;
  }
  | {
    kind: "label-equation";
    label: string,
    expr: string;
  }
  | {
      kind: "expression";
      expr: string;
      startX: string;
      endX: string;
    }
  | {
      kind: "label-expression";
      label: string;
      expr: string;
      startX: string;
      endX: string;
    };

export const register = (
  mod: { Function: SpecConstructible<SkGgbFunctionCtorSpec, SkGgbFunction> },
  appApi: AppApi
) => {
  const ggb = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("Function", {
    constructor: function Function(this: SkGgbFunction, spec: SkGgbFunctionCtorSpec) {
      const setLabelArgs = setGgbLabelFromArgs(ggb, this, "Function");
      const setLabelCmd = setGgbLabelFromCmd(ggb, this);

      switch (spec.kind) {
        case "wrap-existing": {
          this.$ggbLabel = spec.label;
          break;
        }
        
        // New case 1: Direct equation
        case "equation": {
          const { expr } = spec;
          const cmd = `${expr}`;
          setLabelCmd(cmd, { allowNullLabel: true });
          const result = ggb.evalCmd(cmd); // Directly evaluate the equation
          throwIfLabelNull(result, `Failed to create object for equation: ${expr}`);
          this.$ggbLabel = result
          return ggb.wrapExistingGgbObject(this.$ggbLabel);
          
          break;
        }
        // New case 2: Label + equation
        case "label-equation": {
          const { label, expr } = spec;
          
          // Assign the equation to the user-defined label
          const cmd = `${label} := ${expr}`; // Use ':=' to explicitly define and associate the label with the equation
          setLabelCmd(cmd, { allowNullLabel: true });
          const result = ggb.evalCmd(cmd);  
          
          // Ensure the label exists and is valid
          throwIfLabelNull(result, `Failed to create labeled equation: ${cmd}`);
          this.$ggbLabel = label; // Use the provided label

          return ggb.wrapExistingGgbObject(this.$ggbLabel); // circle/line/parabola
          // return new Sk.builtin.str(this.$ggbLabel)
          break;
        }
        case "expression": { // expression is currently not a GgbObject, thus cannot be wrapped
          const { expr, startX, endX } = spec;
          const cmd = `Function(${expr}, ${startX}, ${endX})`
          setLabelCmd(cmd, { allowNullLabel: true });
          const result = ggb.evalCmd(cmd); 
          throwIfLabelNull(result, `Failed to create object for equation: ${expr}`);
          this.$ggbLabel = result
          return ggb.wrapExistingGgbObject(this.$ggbLabel); //function

          break;
        }
        case "label-expression": {
          const { label, expr, startX, endX } = spec;
          const cmd = `${label} = Function(${expr}, ${startX}, ${endX})`;
          setLabelCmd(cmd, { allowNullLabel: true });
          const result = ggb.evalCmd(cmd); 
          throwIfLabelNull(result, `Failed to create object for equation: ${expr}`);
          this.$ggbLabel = label
          return ggb.wrapExistingGgbObject(this.$ggbLabel);
          break;
        }
        default:
          throw new Sk.builtin.TypeError(
            `bad Function spec kind "${(spec as any).kind}"`
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
          "Function() arguments must be (expression, startX, endX) or (label, expression, startX, endX)"
        );

        const make = (spec: SkGgbFunctionCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.Function(spec), kwargs);

        switch (args.length) {
          case 1: { // Case 1: Direct equation
            if (Sk.builtin.checkString(args[0])) {
              const expr = args[0].v;
              return make({ kind: "equation", expr });
            }
            throw badArgsError;
          }
          case 2: { // Case 2: Label + equation
            if (Sk.builtin.checkString(args[0]) && Sk.builtin.checkString(args[1])) {
              const label = args[0].v;
              const expr = args[1].v;
              return make({ kind: "label-equation", label, expr });
            }
            throw badArgsError;
          }
          case 3: {
            if (Sk.builtin.checkString(args[0]) && (ggb.isPythonOrGgbNumber(args[1])) &&  (ggb.isPythonOrGgbNumber(args[2])) ) {
              const expr = args[0].v;
              const startX = ggb.numberValueOrLabel(args[1]);
              const endX = ggb.numberValueOrLabel(args[2]);
              return make({ kind: "expression", expr, startX, endX });
            }
            throw badArgsError;
          }
          case 4: { // Label + expression + interval
            if (
              Sk.builtin.checkString(args[0]) &&
              Sk.builtin.checkString(args[1]) &&
              args.slice(2).every(ggb.isPythonOrGgbNumber)
            ) {
              const label = args[0].v;
              const expr = args[1].v;
              const startX = ggb.numberValueOrLabel(args[2]);
              const endX = ggb.numberValueOrLabel(args[3]);
              return make({ kind: "label-expression", label, expr, startX, endX });
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

  mod.Function = cls;
  registerObjectType("function", cls);
};