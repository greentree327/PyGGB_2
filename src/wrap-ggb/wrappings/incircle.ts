import { AppApi } from "../../shared/appApi";
import {
  augmentedGgbApi,
  withPropertiesFromNameValuePairs,
  WrapExistingCtorSpec,
  SkGgbObject,
  AugmentedGgbApi,
  assembledCommand,
} from "../shared";
import {
  KeywordArgsArray,
  SkObject,
  SkulptApi,
} from "../../shared/vendor-types/skulptapi";
import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

// TODO: If we pass an explicit list of points, we get a GGB object with
// type like "quadrilateral" or "pentagon".  Haven't tested to see how
// far this goes.  What are the consequences for, e.g., wrap-existing?

interface SkGgbPolygon extends SkGgbObject {
  point1: SkGgbObject;
  point2: SkGgbObject;
  point3: SkGgbObject;
}

type SkGgbPolygonCtorSpec ={
      point1: SkGgbObject;
      point2: SkGgbObject;
      point3: SkGgbObject;
    };

export const register = (mod: any, appApi: AppApi) => {
  const ggb: AugmentedGgbApi = augmentedGgbApi(appApi.ggb);

  const cls = Sk.abstr.buildNativeClass("Incircle", {
    constructor: function Incircle(
      this: SkGgbPolygon,
      spec: SkGgbPolygonCtorSpec
    ) {
      this.point1 = spec.point1; 
      this.point2 = spec.point2; 
      this.point3 = spec.point3; 

      // Plot the incircle
      const ggbCmd = assembledCommand("Incircle", [
        this.point1.$ggbLabel,
        this.point2.$ggbLabel,
        this.point3.$ggbLabel
      ]);
      const lbls = ggb.evalCmd(ggbCmd); // g
      this.$ggbLabel = lbls; // Incircle ggblabel is g
      // TODO: Should have n.args + 1 labels here; check this.


      // Calculate the incentre, using incentre formula

      const length12 = ggb.getValue(ggb.evalCmd(assembledCommand("Distance", [this.point1.$ggbLabel,this.point2.$ggbLabel])))
      
      const length23 = ggb.getValue(ggb.evalCmd(assembledCommand("Distance", [this.point2.$ggbLabel,this.point3.$ggbLabel])))
      const length31 = ggb.getValue(ggb.evalCmd(assembledCommand("Distance", [this.point3.$ggbLabel,this.point1.$ggbLabel])))

      const X1 = ggb.getXcoord(this.point1.$ggbLabel)
      const Y1 = ggb.getYcoord(this.point1.$ggbLabel)
      const X2 = ggb.getXcoord(this.point2.$ggbLabel)
      const Y2 = ggb.getYcoord(this.point2.$ggbLabel)
      const X3 = ggb.getXcoord(this.point3.$ggbLabel)
      const Y3 = ggb.getYcoord(this.point3.$ggbLabel)

      const incentre_X_coord = (length23 * X1 + length31 * X2 + length12 * X3) / (length12 + length23 + length31)
      const incentre_Y_coord = (length23 * Y1 + length31 * Y2 + length12 * Y3) / (length12 + length23 + length31)
      return new Sk.builtin.str(`(${incentre_X_coord}, ${incentre_Y_coord})`);
    },

    
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "Incircle() arguments must be (point, point, point)"
        );

        const make = (spec: SkGgbPolygonCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.Incircle(spec), kwargs);


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
    getsets: {
      is_visible: ggb.sharedGetSets.is_visible,
      with_label: ggb.sharedGetSets.label_visible,
      color: ggb.sharedGetSets.color,
      color_floats: ggb.sharedGetSets.color_floats,
      opacity: ggb.sharedGetSets.opacity,
      line_thickness: ggb.sharedGetSets.line_thickness,
      _ggb_type: ggb.sharedGetSets._ggb_type,
      // TODO: List of segments?
    },
  });

  mod.Incircle = cls;
  registerObjectType("incircle", cls);
};
