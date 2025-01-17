import { AppApi } from "../../shared/appApi";
import {
  augmentedGgbApi,
  withPropertiesFromNameValuePairs,
  SkGgbObject,
  assembledCommand,
} from "../shared";

import { SkulptApi } from "../../shared/vendor-types/skulptapi";

import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

interface SkGgbPerpendicularLine extends SkGgbObject {
  point: SkGgbObject;
  object: SkGgbObject;
  context?: any; // Optional context for 3D behavior (e.g., z=0 or space)
}

type SkGgbPerpendicularLineCtorSpec = {
  point: SkGgbObject;
  object: SkGgbObject;
  context?: any;
};

// Registration function
export const register = (mod: any, appApi: AppApi) => {
  const ggb = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("PerpendicularLine", {
    constructor: function PerpendicularLine(
      this: SkGgbPerpendicularLine,
      spec: SkGgbPerpendicularLineCtorSpec
    ) {
      this.point = spec.point; // Assign the point from the input spec
      this.object = spec.object; // Assign the object (line/segment/vector) from the input spec
      this.context = spec.context; // Optional context for 3D behavior

      // Construct the GeoGebra PerpendicularLine command
      let perpendicularCommand: string;
      if (this.context) {
        // For 3D objects, include the context
        perpendicularCommand = assembledCommand("PerpendicularLine", [
          this.point.$ggbLabel,
          this.object.$ggbLabel,
          this.context,
        ]);
      } else {
        // For 2D objects, only use the point and object
        perpendicularCommand = assembledCommand("PerpendicularLine", [
          this.point.$ggbLabel,
          this.object.$ggbLabel,
        ]);
      }

      // Evaluate the PerpendicularLine command in GeoGebra
      const perpendicularLineLabel = ggb.evalCmd(perpendicularCommand);

      // Assign the resulting line's label
      this.$ggbLabel = perpendicularLineLabel;

      // Return a message indicating the line was created
      return new Sk.builtin.str('Perpendicular line created.');
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "PerpendicularLine() requires a point and an object (line, segment, or vector)."
        );

        const make = (spec: SkGgbPerpendicularLineCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.PerpendicularLine(spec), kwargs);

        if (
          args.length === 2 &&
          ggb.isGgbObjectOfType(args[0], "point") &&
          (ggb.isGgbObjectOfType(args[1], "line") ||
            ggb.isGgbObjectOfType(args[1], "segment") ||
            ggb.isGgbObjectOfType(args[1], "vector"))
        ) {
          // For 2D behavior
          return make({
            point: args[0],
            object: args[1],
          });
        } else if (
          args.length === 3 &&
          ggb.isGgbObjectOfType(args[0], "point") &&
          (ggb.isGgbObjectOfType(args[1], "line") ||
            ggb.isGgbObjectOfType(args[1], "segment") ||
            ggb.isGgbObjectOfType(args[1], "vector"))
        ) {
          // For 3D behavior
          return make({
            point: args[0],
            object: args[1],
            context: args[2], // Third argument specifies the context (e.g., z=0 or space)
          });
        }

        throw badArgsError;
      },
      tp$repr(this: SkGgbPerpendicularLine) {
        return new Sk.builtin.str(`PerpendicularLine(${this.point.$ggbLabel}, ${this.object.$ggbLabel})`);
      },
    },
    methods: {
      // Method to get the label of the perpendicular line
      get_label(this: SkGgbPerpendicularLine) {
        return new Sk.builtin.str(this.$ggbLabel);
      },
    },
    getsets: {
      // Getter for the resulting line's label
      label: {
        get(this: SkGgbPerpendicularLine) {
          return new Sk.builtin.str(this.$ggbLabel);
        },
      },
    },
  });

  mod.PerpendicularLine = cls;
  registerObjectType("perpendicular_line", cls);
};