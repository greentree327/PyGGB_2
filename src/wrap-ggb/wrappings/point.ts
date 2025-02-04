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

interface SkGgbPoint extends SkGgbObject {
  $xCoord(this: SkGgbPoint): number;
  $ggbNumberX: SkGgbObject;
  $setXCoord(this: SkGgbPoint, x: number): void;
  $yCoord(this: SkGgbPoint): number;
  $ggbNumberY: SkGgbObject;
  $setYCoord(this: SkGgbPoint, y: number): void;
}

type SkGgbPointCtorSpec =
  | WrapExistingCtorSpec
  | {
      kind: "coordinates";
      x: string;
      y: string;
    }
  | {
    kind: "label-coordinates";
    label: string;
    x: string;
    y: string;
  }
  | {
      kind: "arbitrary-on-object";
      obj: string;
    }
  | {
    kind: "label-arbitrary-on-object"; // NEW case
    label: string; // User-defined label
    obj: string;   // Object on which the point is located
  }
  | {
      kind: "object-parameter";
      p: string;
      t: SkObject;
    };

export const register = (
  mod: { Point: SpecConstructible<SkGgbPointCtorSpec, SkGgbPoint> },
  appApi: AppApi
) => {
  const ggb = augmentedGgbApi(appApi.ggb);
  const skApi = appApi.sk;

  const cls = Sk.abstr.buildNativeClass("Point", {
    constructor: function Point(this: SkGgbPoint, spec: SkGgbPointCtorSpec) {
      const setLabelArgs = setGgbLabelFromArgs(ggb, this, "Point");
      const setLabelCmd = setGgbLabelFromCmd(ggb, this);

      switch (spec.kind) {
        case "wrap-existing": {
          this.$ggbLabel = spec.label;
          break;
        }
        case "coordinates": {
          setLabelCmd(`(${spec.x}, ${spec.y})`); // this is the function that provides the label for the point
          break;
        }
        case "label-coordinates": {
          const label = spec.label;
          setLabelCmd(`${label} = (${spec.x}, ${spec.y})`);
          break;
        }
        case "arbitrary-on-object": {
          setLabelArgs([spec.obj]);
          throwIfLabelNull(
            this.$ggbLabel,
            "Point(object): could not find arbitrary point" +
              ` along "${ggb.ggbType(spec.obj)}" object`
          );
          break;
        }
        case "label-arbitrary-on-object": { // New case
          const label = spec.label;
          const obj = spec.obj;
          const cmd = `${label} = Point(${obj})`; // Create point on the object with the label
          const result = ggb.evalCmd(cmd); // Evaluate the command in GeoGebra
          this.$ggbLabel = result; // Assign the resulting label to the point
          throwIfLabelNull(
            this.$ggbLabel,
            `Point(object): could not create labeled point "${label}" along "${obj}"`
          );
          break;
        }
        case "object-parameter": {
          // Handle a null return value from evalCmd() manually, to give
          // a more helpful error message.
          setLabelArgs([spec.p, ggb.numberValueOrLabel(spec.t)], {
            allowNullLabel: true,
          });
          throwIfLabelNull(
            this.$ggbLabel,
            "Point(object, parameter): could not find point" +
              ` along "${ggb.ggbType(spec.p)}" object`
          );
          break;
        }
        default:
          throw new Sk.builtin.TypeError(
            `bad Point spec kind "${(spec as any).kind}"`
          );
      }

      // TODO: Would be cleaner to avoid making a new dependent Number
      // if a passed-in coord was already a Number.
      //
      this.$ggbNumberX = ggb.wrapExistingGgbObject(
        ggb.evalCmd(`x(${this.$ggbLabel})`)
      );
      this.$ggbNumberY = ggb.wrapExistingGgbObject(
        ggb.evalCmd(`y(${this.$ggbLabel})`)
      );

      this.$updateHandlers = [];
      ggb.registerObjectUpdateListener(this.$ggbLabel, () =>
        this.$fireUpdateEvents()
      );
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "Point() arguments must be" + 
            " (x_coord, y_coord) or (object, parameter)"
        );

        const make = (spec: SkGgbPointCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.Point(spec), kwargs);

        switch (args.length) {
          case 1: {
            if (ggb.isGgbObject(args[0])) {
              const obj = args[0].$ggbLabel;
              return make({ kind: "arbitrary-on-object", obj });
            }

            throw badArgsError;
          }
          case 2: {
            if (Sk.builtin.checkString(args[0]) && ggb.isGgbObject(args[1])) {
              const label = args[0].v;
              const obj = args[1].$ggbLabel;
              return make({ kind: "label-arbitrary-on-object", label, obj });
            }
            if (args.every(ggb.isPythonOrGgbNumber)) {
              const x = ggb.numberValueOrLabel(args[0]);
              const y = ggb.numberValueOrLabel(args[1]);
              return make({ kind: "coordinates", x, y });
            }

            if (ggb.isGgbObject(args[0]) && ggb.isPythonOrGgbNumber(args[1])) {
              const p = args[0].$ggbLabel;
              const t = args[1];
              return make({ kind: "object-parameter", p, t });
            }

            throw badArgsError;
          }
          case 3: { // Label + x and y coordinates
            if (Sk.builtin.checkString(args[0]) && args.slice(1).every(ggb.isPythonOrGgbNumber)) {
              const label = args[0].v;
              const x = ggb.numberValueOrLabel(args[1]);
              const y = ggb.numberValueOrLabel(args[2]);
              return make({ kind: "label-coordinates", label, x, y });
            }
            throw badArgsError;
          }
          default:
            throw badArgsError;
        }
      },
      tp$str(this: SkGgbPoint) { // defines the string representation in the user interface
        return new Sk.builtin.str(`(${this.$xCoord()}, ${this.$yCoord()})`);
      },
      $r(this: SkGgbPoint) { // defines the string representation in developer interface
        return new Sk.builtin.str(
          `Point(${this.$xCoord()}, ${this.$yCoord()})`
        );
      },
      ...ggb.sharedOpSlots,
    },
    proto: {
      $xCoord(this: SkGgbPoint) {
        return ggb.getXcoord(this.$ggbLabel);
      },
      $setXCoord(this: SkGgbPoint, x: number) {
        // Hm; mildly annoying:
        ggb.setCoords(this.$ggbLabel, x, this.$yCoord());
      },
      $yCoord(this: SkGgbPoint) {
        return ggb.getYcoord(this.$ggbLabel);
      },
      $setYCoord(this: SkGgbPoint, y: number) {
        // Hm; mildly annoying:
        ggb.setCoords(this.$ggbLabel, this.$xCoord(), y);
      },
      $fireUpdateEvents(this: SkGgbPoint) {
        this.$updateHandlers.forEach((fun) => {
          try {
            Sk.misceval.callsimOrSuspend(fun);
          } catch (e) {
            skApi.onError(e as any);
          }
        });
      },
    },
    methods: {
      when_moved: {
        $meth(this: SkGgbPoint, pyFun: any) {
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
      size: ggb.sharedGetSets.size, // size of label points (circle)
      x: {
        $get(this: SkGgbPoint) {
          return new Sk.builtin.float_(this.$xCoord());
        },
        $set(this: SkGgbPoint, pyX: SkObject) {
          // Throw if not isIndependent(this)?
          throwIfNotNumber(pyX, "x coord");
          this.$setXCoord(pyX.v);
        },
      },
      x_number: {
        $get(this: SkGgbPoint) {
          return this.$ggbNumberX;
        },
      },
      y: {
        $get(this: SkGgbPoint) {
          return new Sk.builtin.float_(this.$yCoord());
        },
        $set(this: SkGgbPoint, pyY: SkObject) {
          throwIfNotNumber(pyY, "y coord");
          this.$setYCoord(Sk.ffi.remapToJs(pyY));
        },
      },
      y_number: {
        $get(this: SkGgbPoint) {
          return this.$ggbNumberY;
        },
      },
      _ggb_type: ggb.sharedGetSets._ggb_type,
    },
  });

  mod.Point = cls;
  registerObjectType("point", cls);
};
