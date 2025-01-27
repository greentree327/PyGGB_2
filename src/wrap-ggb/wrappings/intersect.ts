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
  object1: SkGgbObject;
  object2: SkGgbObject;
  index?: number;
  range?: { x1: number; x2: number };
}

type SkGgbIntersectCtorSpec =
  | WrapExistingCtorSpec
  | {
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
      x1: number;
      x2: number;
    }
  | {
      kind: "labeled-indexed";
      label: string;
      object1: SkGgbObject;
      object2: SkGgbObject;
      index: string;
    };

export const register = (
  mod: { Intersect: SpecConstructible<SkGgbIntersectCtorSpec, SkGgbIntersect> },
  appApi: AppApi
) => {
  const ggb = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("Intersect", {
    constructor: function Intersect(this: SkGgbIntersect, spec: SkGgbIntersectCtorSpec) {
      const setLabelCmd = setGgbLabelFromCmd(ggb, this); // Call the Outer Function, The result is a new function, setLabelCmd,
      let ggbCmd; // currently undefined

      switch (spec.kind) {
        case "wrap-existing": {
          this.$ggbLabel = spec.label;
          
          break;
        }
        case "basic": {
          const ggbCmd = `Intersect(${spec.object1.$ggbLabel}, ${spec.object2.$ggbLabel})`; 
          // Set the label, allowing null results
          setLabelCmd(ggbCmd, { allowNullLabel: true }); // We can now call the returned setLabelCmd function with its own parameters: (fullCommand, ?userOptions)

          const label = ggb.evalCmdMultiple(ggbCmd);
          const filteredLabel = label.filter(item => item !== null && item !== 'null'); // filter null
          const filteredPoints = filteredLabel.filter((filteredLabel) => { // filter Intersection point with (Nan,NaN)
            const xCoord = ggb.getXcoord(filteredLabel);
            return xCoord ; 
          });
          if (filteredPoints.length === 0) {
            const message = `No intersection points found`
            return new Sk.builtin.str(message);
          }
          // Wrap and return the filtered points as a Python string
          if (Array.isArray(filteredPoints)) { // if the result is an array
            const result =  filteredPoints.map((item) => ggb.wrapExistingGgbObject(item)); // ok
            return new Sk.builtin.str(result.join(", ")) // ok
          } 
          else if (typeof filteredPoints === "string") {
            return ggb.wrapExistingGgbObject(filteredPoints); // Return as a Python-compatible string
          } 
          else {
            throw new Error(`Unexpected return type: ${typeof filteredPoints}`);
          } 
          break;
        }
        case "indexed": {
          const ggbCmd = `Intersect(${spec.object1.$ggbLabel}, ${spec.object2.$ggbLabel}, ${spec.index})`; 
          setLabelCmd(ggbCmd, { allowNullLabel: true });

          const label = ggb.evalCmdMultiple(ggbCmd);
          const filteredLabel = label.filter(item => item !== null && item !== 'null'); // filter null
          // Extract x-coordinates for valid labels
          const filteredPoints = filteredLabel.filter((filteredLabel) => { // filter Intersection point with (Nan,NaN)
            const xCoord = ggb.getXcoord(filteredLabel);
            return xCoord ; 
          });
          if (filteredPoints.length === 0) {
            const message = `No intersection points found`
            return new Sk.builtin.str(message);
          }
          // Wrap and return the filtered points as a Python string
          if (Array.isArray(filteredPoints)) { // if the result is an array
            const result =  filteredPoints.map((item) => ggb.wrapExistingGgbObject(item)); // ok
            return new Sk.builtin.str(result.join(", ")) // ok
          } 
          else if (typeof filteredPoints === "string") {
            return ggb.wrapExistingGgbObject(filteredPoints); // Return as a Python-compatible string
          } 
          else {
            throw new Error(`Unexpected return type: ${typeof filteredPoints}`);
          } 
          break;
        }
        case "Initial Point": {
          const ggbCmd = `Intersect(${spec.object1.$ggbLabel}, ${spec.object2.$ggbLabel}, ${spec.point.$ggbLabel})`; 
          setLabelCmd(ggbCmd, { allowNullLabel: true });

          const label = ggb.evalCmdMultiple(ggbCmd);
          const filteredLabel = label.filter(item => item !== null && item !== 'null'); // filter null
          // Extract x-coordinates for valid labels
          const filteredPoints = filteredLabel.filter((filteredLabel) => { // filter Intersection point with (Nan,NaN)
            const xCoord = ggb.getXcoord(filteredLabel);
            return xCoord ; 
          });
          if (filteredPoints.length === 0) {
            const message = `No intersection points found`
            return new Sk.builtin.str(message);
          }
          // Wrap and return the filtered points as a Python string
          if (Array.isArray(filteredPoints)) { // if the result is an array
            const result =  filteredPoints.map((item) => ggb.wrapExistingGgbObject(item)); // ok
            return new Sk.builtin.str(result.join(", ")) // ok
          } 
          else if (typeof filteredPoints === "string") {
            return ggb.wrapExistingGgbObject(filteredPoints); // Return as a Python-compatible string
          } 
          else {
            throw new Error(`Unexpected return type: ${typeof filteredPoints}`);
          } 
          break;
        }
        case "range": {
          const ggbCmd = `Intersect(${spec.object1.$ggbLabel}, ${spec.object2.$ggbLabel})`; 
          setLabelCmd(ggbCmd, { allowNullLabel: true });

          const label = ggb.evalCmdMultiple(ggbCmd);
          
          const filteredLabel = label.filter(item => item !== null && item !== 'null');
          // Filter points based on the x-coordinate range
          const filteredPoints = filteredLabel.filter((filteredLabel) => {
            const xCoord = ggb.getXcoord(filteredLabel);
            return xCoord >= spec.x1 && xCoord <= spec.x2;
          });
          
          if (filteredPoints.length === 0) {
            const message = `No intersection points found within the x-interval [${spec.x1}, ${spec.x2}]`
            return new Sk.builtin.str(message);
          }
          // Wrap and return the filtered points as a Python string
          if (Array.isArray(filteredPoints)) { // if the result is an array
            const result =  filteredPoints.map((item) => ggb.wrapExistingGgbObject(item)); // ok
            return new Sk.builtin.str(result.join(", ")) // ok
          } 
          else if (typeof filteredPoints === "string") {
            return ggb.wrapExistingGgbObject(filteredPoints); // Return as a Python-compatible string
          } 
          else {
            throw new Error(`Unexpected return type: ${typeof filteredPoints}`);
          } 
          break;
        }
          
        case "labeled-indexed": {
          this.$ggbLabel = spec.label;

          const ggbCmd = `${spec.label} = Intersect(${spec.object1.$ggbLabel}, ${spec.object2.$ggbLabel}, ${spec.index})`;
          setLabelCmd(ggbCmd, { allowNullLabel: true });
          const label = ggb.evalCmd(ggbCmd);
          return ggb.wrapExistingGgbObject(label);
          break;
        }
        default:
          throw new Sk.builtin.TypeError(
            `bad Intersect spec kind "${(spec as any).kind}"`
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
          "Intersect() arguments must be (object1, object2), " +
            "(object1, object2, index), " +
            "(object1, object2, point)"  +
            "(object1, object2, x1, x2), or " +
            "(label, object1, object2, index)"
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
            }
            throw badArgsError;
          }
          case 4: {
            if (Sk.builtin.checkString(args[0]) && ggb.isGgbObject(args[1]) && ggb.isGgbObject(args[2]) && ggb.isPythonOrGgbNumber(args[3])) {
              const label = args[0].v;
              const index = ggb.numberValueOrLabel(args[3]);
              return make({
                kind: "labeled-indexed",
                label,
                object1: args[1],
                object2: args[2],
                index: index,
              });
            } else if (
              ggb.isGgbObject(args[0]) &&
              ggb.isGgbObject(args[1]) &&
              ggb.isPythonOrGgbNumber(args[2]) &&
              ggb.isPythonOrGgbNumber(args[3])
            ) {
              const x1 = parseFloat(
                eval(ggb.numberValueOrLabel(args[2]).replace(/\*10\^\(\+?(-?\d+)\)/g, "* Math.pow(10, $1)"))
              );
              const x2 = parseFloat(
                eval(ggb.numberValueOrLabel(args[3]).replace(/\*10\^\(\+?(-?\d+)\)/g, "* Math.pow(10, $1)"))
              );
              return make({
                kind: "range",
                object1: args[0],
                object2: args[1],
                x1,
                x2,
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