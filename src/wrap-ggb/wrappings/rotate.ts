import { AppApi } from "../../shared/appApi";
import {
  augmentedGgbApi,
  withPropertiesFromNameValuePairs,
  SkGgbObject,
  SpecConstructible,
  setGgbLabelFromCmd,
  assembledCommand,
} from "../shared";
import { SkulptApi } from "../../shared/vendor-types/skulptapi";
import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

interface SkGgbRotate extends SkGgbObject {
  object: SkGgbObject;
  angle: number;
  rotationCenter?: SkGgbObject;
}

type SkGgbRotateCtorSpec =
  | {
      kind: "basic"; // Rotate(object, angle), centre of rotation = (0,0)
      object: SkGgbObject;
      angle: number;
    }
  | {
    kind: "basic-direction"; // Rotate(object, angle, direction), centre of rotation = (0,0)
    object: SkGgbObject;
    angle: number;
    direction: string;
  }
  | {
      kind: "center"; // Rotate(object, angle, rotation_center_point)
      object: SkGgbObject;
      angle: number;
      rotationCenter: SkGgbObject;
    }
  |{
    kind: "center-direction"; // Rotate(object, angle, rotation_center_point, direction)
    object: SkGgbObject;
    angle: number;
    rotationCenter: SkGgbObject;
    direction: string;
  }
  | {
      kind: "labeled-center"; // Rotate(label, object, angle, rotation_center_point)
      label: string;
      object: SkGgbObject;
      angle: number;
      rotationCenter: SkGgbObject;
  }
  | {
    kind: "labeled-center-direction"; // Rotate(label, object, angle, rotation_center_point,direction)
    label: string;
    object: SkGgbObject;
    angle: number;
    rotationCenter: SkGgbObject;
    direction: string;
  };

export const register = (
  mod: { Rotate: SpecConstructible<SkGgbRotateCtorSpec, SkGgbRotate> },
  appApi: AppApi
) => {
  const ggb = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("Rotate", {
    constructor: function Rotate(this: SkGgbRotate, spec: SkGgbRotateCtorSpec) {
      const setLabelCmd = setGgbLabelFromCmd(ggb, this); // Helper function for setting labels
      let ggbCmd: string; // Command to execute

      // Handle different cases based on `spec.kind`
      switch (spec.kind) {
        case "basic": {
          // Rotate(object, angle)
          const angleInRadians = (spec.angle * Math.PI) / 180; // Convert to radians
          ggbCmd = `Rotate(${spec.object.$ggbLabel}, ${angleInRadians})`;
          setLabelCmd(ggbCmd, { allowNullLabel: true });
          break;
        }
        case "basic-direction": {
          // Rotate(object, angle,direction)
          let angle; // Declare angle ouside the if-else block
          if (spec.direction === "clockwise"){
            angle = 360 - spec.angle;
          } else {
            angle = spec.angle;
          }
          const angleInRadians = (angle * Math.PI) / 180; // Convert to radians
          ggbCmd = `Rotate(${spec.object.$ggbLabel}, ${angleInRadians})`;
          setLabelCmd(ggbCmd, { allowNullLabel: true });
          break;
        }
        case "center": {
          // Rotate(object, angle, rotation_center_point)
          const angleInRadians = (spec.angle * Math.PI) / 180;
          ggbCmd = `Rotate(${spec.object.$ggbLabel}, ${angleInRadians}, ${spec.rotationCenter.$ggbLabel})`;
          setLabelCmd(ggbCmd, { allowNullLabel: true });
          break;
        }
        case "center-direction": {
          // Rotate(object, angle, rotation_center_point,direction)
          const angle = spec.direction === "clockwise" ? 360 - spec.angle : spec.angle;
          const angleInRadians = (angle * Math.PI) / 180;
          ggbCmd = `Rotate(${spec.object.$ggbLabel}, ${angleInRadians}, ${spec.rotationCenter.$ggbLabel})`;
          setLabelCmd(ggbCmd, { allowNullLabel: true });
          break;
        }
        case "labeled-center": {
          // Rotate(label, object, angle, rotation_center_point)
          const angleInRadians = (spec.angle * Math.PI) / 180;
          ggbCmd = `${spec.label} = Rotate(${spec.object.$ggbLabel}, ${angleInRadians}, ${spec.rotationCenter.$ggbLabel})`;
          setLabelCmd(ggbCmd, { allowNullLabel: true });
          break;
        }
        case "labeled-center-direction": {
          // Rotate(label, object, angle, rotation_center_point,direction)
          const angle = spec.direction === "clockwise"? 360-spec.angle : spec.angle;
          const angleInRadians = (angle * Math.PI) / 180;
          ggbCmd = `${spec.label} = Rotate(${spec.object.$ggbLabel}, ${angleInRadians}, ${spec.rotationCenter.$ggbLabel})`;
          setLabelCmd(ggbCmd, { allowNullLabel: true });
          break;
        }
        default:
          throw new Sk.builtin.TypeError(
            `Invalid Rotate spec kind "${(spec as any).kind}"`
          );
      }

      // Evaluate the command and set the label
      const label = ggb.evalCmd(ggbCmd);
      this.$ggbLabel = label;

      // Register update handlers for the rotated object
      this.$updateHandlers = [];
      ggb.registerObjectUpdateListener(this.$ggbLabel, () =>
        this.$fireUpdateEvents()
      );
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "Rotate() arguments must be (object, angle), " + "(object, angle,direction)" +
            "(object, angle, rotation_center_point), or " + "(object, angle, rotation_center_point,direction)" +
            "(label, object, angle, rotation_center_point)" + "(label, object, angle, rotation_center_point,direction)"
        );

        const make = (spec: SkGgbRotateCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.Rotate(spec), kwargs);

        switch (args.length) {
          case 2: {
            // Rotate(object, angle)
            if (ggb.isGgbObject(args[0]) && ggb.isPythonOrGgbNumber(args[1])) {
              const angle = ggb.getValue(ggb.numberValueOrLabel(args[1]));
              return make({ kind: "basic", object: args[0], angle });
            }
            throw badArgsError;
          }
          case 3: {
            // Rotate(object, angle, rotation_center_point)
            if (
              ggb.isGgbObject(args[0]) &&
              ggb.isPythonOrGgbNumber(args[1]) &&
              ggb.isGgbObjectOfType(args[2], "point")
            ) {
              const angle = ggb.getValue(ggb.numberValueOrLabel(args[1]));
              return make({
                kind: "center",
                object: args[0],
                angle,
                rotationCenter: args[2],
              });
            } else if (ggb.isGgbObject(args[0]) && ggb.isPythonOrGgbNumber(args[1]) && Sk.builtin.checkString(args[2])) { // (object, angle,direction)
              const angle = ggb.getValue(ggb.numberValueOrLabel(args[1]));
              const direction = args[2].v;
              return make({ kind: "basic-direction", object: args[0], angle, direction});
            }
            throw badArgsError;
          }
          case 4: {
            // Rotate(label, object, angle, rotation_center_point)
            if (
              Sk.builtin.checkString(args[0]) &&
              ggb.isGgbObject(args[1]) &&
              ggb.isPythonOrGgbNumber(args[2]) &&
              ggb.isGgbObjectOfType(args[3], "point")
            ) {
              const label = args[0].v;
              const angle = ggb.getValue(ggb.numberValueOrLabel(args[2]));
              return make({
                kind: "labeled-center",
                label,
                object: args[1],
                angle,
                rotationCenter: args[3],
              });
            } else if (ggb.isGgbObject(args[0]) &&
            ggb.isPythonOrGgbNumber(args[1]) &&
            ggb.isGgbObjectOfType(args[2], "point") &&
            Sk.builtin.checkString(args[3])
            ) { // (object, angle, rotation_center_point,direction)
              const angle = ggb.getValue(ggb.numberValueOrLabel(args[1]));
              const direction = args[3].v;
              return make({
                kind: "center-direction",
                object: args[0],
                angle,
                rotationCenter: args[2],
                direction,
              });
            }
            throw badArgsError;
          }
          case 5: {
            // (label, object, angle, rotation_center_point, direction)
            if (
              Sk.builtin.checkString(args[0]) &&
              ggb.isGgbObject(args[1]) &&
              ggb.isPythonOrGgbNumber(args[2]) &&
              ggb.isGgbObjectOfType(args[3], "point") &&
              Sk.builtin.checkString(args[4])
            ) {
              const label = args[0].v;
              const angle = ggb.getValue(ggb.numberValueOrLabel(args[2]));
              const direction = args[4].v;
          
              return make({
                kind: "labeled-center-direction",
                label,
                object: args[1],
                angle,
                rotationCenter: args[3],
                direction,
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
        $meth(this: SkGgbRotate, pyFun: any) {
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

  mod.Rotate = cls;
  registerObjectType("rotate", cls);
};