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

interface SkGgbCircumcentre extends SkGgbObject {
  point1: SkGgbObject;
  point2: SkGgbObject;
  point3: SkGgbObject;
}

type SkGgbCircumcentreCtorSpec = {
      point1: SkGgbObject;
      point2: SkGgbObject;
      point3: SkGgbObject;
    };

export const register = (mod: any, appApi: AppApi) => {
  const ggb = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("Circumcentre", {
    constructor: function Circumcentre(
      this: SkGgbCircumcentre,
      spec: SkGgbCircumcentreCtorSpec
    ) {
      this.point1 = spec.point1;
      this.point2 = spec.point2;
      this.point3 = spec.point3;

      // Step 1: Create perpendicular bisectors for two sides
      const bisector1 = ggb.evalCmd(
        `PerpendicularBisector(${spec.point1.$ggbLabel}, ${spec.point2.$ggbLabel})`
      );
      const bisector2 = ggb.evalCmd(
        `PerpendicularBisector(${spec.point2.$ggbLabel}, ${spec.point3.$ggbLabel})`
      );

      const bisector3 = ggb.evalCmd(
        `PerpendicularBisector(${spec.point3.$ggbLabel}, ${spec.point1.$ggbLabel})`
      );
      

      // Step 2: Find the intersection of the two perpendicular bisectors
      const circumcentreLabel = ggb.evalCmd(
        `Intersect(${bisector1}, ${bisector2})`
      );

      // Step 3: Assign the circumcentre label
      this.$ggbLabel = circumcentreLabel;

      // Retrieve the x- and y-coordinates of the centroid
      const xCoord = ggb.getXcoord(this.$ggbLabel);
      const yCoord = ggb.getYcoord(this.$ggbLabel);

      // Return the coordinates as a formatted string
      return new Sk.builtin.str(`(${xCoord}, ${yCoord})`);
        
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "Circumcentre() arguments must be (point, point, point)"
        );

        const make = (spec: SkGgbCircumcentreCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.Circumcentre(spec), kwargs);



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

  mod.Circumcentre = cls;
  registerObjectType("circumcentre", cls);
};