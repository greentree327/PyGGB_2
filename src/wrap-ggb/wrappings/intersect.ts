import { AppApi } from "../../shared/appApi";
import {
  augmentedGgbApi,
  withPropertiesFromNameValuePairs,
  SkGgbObject,
  WrapExistingCtorSpec,
  SpecConstructible,
  setGgbLabelFromCmd,assembledCommand
} from "../shared";
import { SkulptApi } from "../../shared/vendor-types/skulptapi";
import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

interface SkGgbIntersect extends SkGgbObject {
  ggbLabels: string[];
  object1: SkGgbObject;
  object2: SkGgbObject;
  index?: number;
  range?: { x1: number; x2: number };
}

type SkGgbIntersectCtorSpec =
  {
      kind: "basic";
      object1: SkGgbObject;
      object2: SkGgbObject;
    }
  | {
      kind: "indexed";
      object1: SkGgbObject;
      object2: SkGgbObject;
      index: string;
    }
  | {
    kind: "Initial Point";
    object1: SkGgbObject;
    object2: SkGgbObject;
    point: SkGgbObject;
  } 
  | {
      kind: "range";
      object1: SkGgbObject;
      object2: SkGgbObject;
      x1: string;
      x2: string;
    }
  | {
      kind: "labeled-basic";
      label: string;
      object1: SkGgbObject;
      object2: SkGgbObject;
    };

export const register = (
  mod: { Intersect: SpecConstructible<SkGgbIntersectCtorSpec, SkGgbIntersect> },
  appApi: AppApi
) => {
  const ggb = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("Intersect", {
    constructor: function Intersect(this: SkGgbIntersect, spec: SkGgbIntersectCtorSpec) {
      const setLabelCmd = setGgbLabelFromCmd(ggb, this); // Call the Outer Function, The result is a new function, setLabelCmd,
      let ggbCmd: string; // since ggbCmd must hold a string value, we explicitly declared it as string

      switch (spec.kind) {
        case "basic": {
          ggbCmd = `Intersect(${spec.object1.$ggbLabel}, ${spec.object2.$ggbLabel})`; 
          break;
        }
        case "indexed": {
          ggbCmd = `Intersect(${spec.object1.$ggbLabel}, ${spec.object2.$ggbLabel}, ${spec.index})`; 
          break;
        }
        case "Initial Point": {
          ggbCmd = `Intersect(${spec.object1.$ggbLabel}, ${spec.object2.$ggbLabel}, ${spec.point.$ggbLabel})`; 
          break;
        }
        /*
        case "range": {
          ggbCmd = `Intersect(${spec.object1.$ggbLabel}, ${spec.object2.$ggbLabel}, ${spec.x1},${spec.x2})`; 
          break;
        }
          */
        case "labeled-basic": {
          this.$ggbLabel = spec.label;
          ggbCmd = `${spec.label} = Intersect(${spec.object1.$ggbLabel}, ${spec.object2.$ggbLabel})`;
          break;
        }
        default:
          throw new Sk.builtin.TypeError(
            `bad Intersect spec kind "${(spec as any).kind}"`
          );
      }
      // Set the label, allowing null results
      setLabelCmd(ggbCmd, { allowNullLabel: true }); // We can now call the returned setLabelCmd function with its own parameters: (fullCommand, ?userOptions)
      
      

      // Evaluate the command and filter the results
      const label:string[] = ggb.evalCmdMultiple(ggbCmd);
      const filteredLabel: string[] = label.filter(item => item !== null && item !== 'null'); // filter null
      // filter Intersection point with (Nan,NaN)
      const filteredPoints: string[] = filteredLabel.filter((filteredLabel) => { // First iterate through each item in filteredLabel
        const xCoord = ggb.getXcoord(filteredLabel); // for each item, get the X-coord
        return !isNaN(xCoord) ;  // if X-coord = NaN, isNaN(xCoord) returns true, so !isNaN(xCoord) return false, so we do not include this item
      });
      
      
      if (filteredPoints.length === 0) {
        const message = `No/Infinite intersection points found`
        return new Sk.builtin.str(message);
      }
      else if (filteredPoints.length === 1) {
        this.$ggbLabel = filteredPoints[0];
      }
      else if (filteredPoints.length >= 2) {
        this.$ggbLabel = filteredPoints[0];
        // const result =  filteredPoints.map((item) => ggb.wrapExistingGgbObject(item)); // ok
        // return new Sk.builtin.str(result.join(", ")) // ok
      }
      else {
        throw new Error(`Unexpected return type: ${typeof filteredPoints}`);
      } 
      

      // Register update handlers
      this.$updateHandlers = []; // Initialize the update handlers array
      ggb.registerObjectUpdateListener(this.$ggbLabel, () =>
        this.$fireUpdateEvents()
      );
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError( // remove "(object1, object2, x1, x2)"
          "Intersect() arguments must be (object1, object2), " +
            "(object1, object2, index), " +
            "(object1, object2, point), or" +
            "(label, object1, object2)"
        );

        const make = (spec: SkGgbIntersectCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.Intersect(spec), kwargs);

        switch (args.length) {
          case 2: {
            if (ggb.isGgbObject(args[0]) && ggb.isGgbObject(args[1])) {
              return make({ kind: "basic", object1: args[0], object2: args[1] });
            }
            throw badArgsError;
          }
          case 3: { // Intersect(A,B, <Index of intersecting point> or <Initial Point>)
            if (ggb.isGgbObject(args[0]) && ggb.isGgbObject(args[1]) && ggb.isPythonOrGgbNumber(args[2])) {
              const index = ggb.numberValueOrLabel(args[2]);
              return make({
                kind: "indexed",
                object1: args[0],
                object2: args[1],
                index: index,
              });
            } else if (ggb.isGgbObject(args[0]) && ggb.isGgbObject(args[1]) && (ggb.isGgbObject(args[2]), 'point')) {
              if (ggb.isGgbObject(args[2])) {
                return make({
                  kind: "Initial Point",
                  object1: args[0],
                  object2: args[1],
                  point: args[2],
                });
              }
            } else if (Sk.builtin.checkString(args[0]) && ggb.isGgbObject(args[1]) && ggb.isGgbObject(args[2])) { // Intersect(label,A,B)
              const label = args[0].v;
              return make({
                kind: "labeled-basic",
                label,
                object1: args[1],
                object2: args[2],
              });
            }
            throw badArgsError;
          }
          /*
          case 4: {
            if (
              ggb.isGgbObject(args[0]) &&
              ggb.isGgbObject(args[1]) &&
              ggb.isPythonOrGgbNumber(args[2]) &&
              ggb.isPythonOrGgbNumber(args[3])
            ) {
              const x1 = parseFloat(eval(ggb.numberValueOrLabel(args[2]).replace(/\*10\^\(\+?(-?\d+)\)/g, "* Math.pow(10, $1)")));
              const x2 = parseFloat(eval(ggb.numberValueOrLabel(args[3]).replace(/\*10\^\(\+?(-?\d+)\)/g, "* Math.pow(10, $1)")));
              
              const start_x = String(x1)
              const end_x = String(x2)
              
              
              return make({
                kind: "range",
                object1: args[0],
                object2: args[1],
                x1:start_x,
                x2:end_x,
              });
              
            }
            throw badArgsError;
          }
            */
          default:
            throw badArgsError;
        }
      },
      ...ggb.sharedOpSlots,
    },
    methods: {
      when_moved: {
        $meth(this: SkGgbIntersect, pyFun: any) {
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

  mod.Intersect = cls;
  registerObjectType("intersect", cls);
};