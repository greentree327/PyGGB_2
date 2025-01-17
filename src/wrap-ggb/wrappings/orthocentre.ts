import { AppApi } from "../../shared/appApi";
import {
  augmentedGgbApi,
  withPropertiesFromNameValuePairs,
  WrapExistingCtorSpec,
  SkGgbObject,
} from "../shared";
import { SkulptApi } from "../../shared/vendor-types/skulptapi";

import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

interface SkGgbOrthocentre extends SkGgbObject {
  point1: SkGgbObject;
  point2: SkGgbObject;
  point3: SkGgbObject;
}

type SkGgbOrthocentreCtorSpec = {
  point1: SkGgbObject;
  point2: SkGgbObject;
  point3: SkGgbObject;
};

export const register = (mod: any, appApi: AppApi) => {
  const ggb = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("Orthocentre", {
    constructor: function Orthocentre(
      this: SkGgbOrthocentre,
      spec: SkGgbOrthocentreCtorSpec
    ) {
      this.point1 = spec.point1;
      this.point2 = spec.point2;
      this.point3 = spec.point3;

      // Step 1: Create lines for the sides of the triangle
      const line1 = ggb.evalCmd(`Segment(${spec.point2.$ggbLabel}, ${spec.point3.$ggbLabel})`);
      const line2 = ggb.evalCmd(`Segment(${spec.point1.$ggbLabel}, ${spec.point3.$ggbLabel})`);
      const line3 = ggb.evalCmd(`Segment(${spec.point1.$ggbLabel}, ${spec.point2.$ggbLabel})`);
      // Step 2: Create altitudes using the PerpendicularLine command
      const altitude1 = ggb.evalCmd(`PerpendicularLine(${spec.point1.$ggbLabel}, ${line1})`);
      const altitude2 = ggb.evalCmd(`PerpendicularLine(${spec.point2.$ggbLabel}, ${line2})`);
      const altitude3 = ggb.evalCmd(`PerpendicularLine(${spec.point3.$ggbLabel}, ${line3})`);
      // (Optional) Set the altitude color to red
      ggb.evalCmd(`SetColor(${altitude1}, 255, 0, 0)`);
      ggb.evalCmd(`SetColor(${altitude2}, 255, 0, 0)`);
      ggb.evalCmd(`SetColor(${altitude3}, 255, 0, 0)`);
      // Step 3: Find the intersection of two altitudes
      const orthocentreLabel = ggb.evalCmd(`Intersect(${altitude1}, ${altitude2})`);

      // Step 4: Assign the orthocentre label
      this.$ggbLabel = orthocentreLabel;

      // Retrieve the x- and y-coordinates of the orthocentre
      const xCoord = ggb.getXcoord(this.$ggbLabel);
      const yCoord = ggb.getYcoord(this.$ggbLabel);

      // Return the coordinates as a formatted string
      return new Sk.builtin.str(`(${xCoord}, ${yCoord})`);
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "Orthocentre() arguments must be (point, point, point)"
        );

        const make = (spec: SkGgbOrthocentreCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.Orthocentre(spec), kwargs);

        if (ggb.everyElementIsGgbObjectOfType(args, "point")) {
          return make({
            point1: args[0],
            point2: args[1],
            point3: args[2],
          });
        }

        throw badArgsError;
      },
    },
    methods: {
      ...ggb.freeCopyMethodsSlice,
    },
    getsets: {
      is_visible: ggb.sharedGetSets.is_visible,
      color: ggb.sharedGetSets.color,
      color_floats: ggb.sharedGetSets.color_floats,
      line_thickness: ggb.sharedGetSets.line_thickness,
      _ggb_type: ggb.sharedGetSets._ggb_type,
    },
  });

  mod.Orthocentre = cls;
  registerObjectType("orthocentre", cls);
};