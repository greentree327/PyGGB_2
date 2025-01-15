import { AppApi } from "../../shared/appApi";
import { 
    augmentedGgbApi, // Construct and return an "augmented GeoGebra API" object
    withPropertiesFromNameValuePairs, //Set the attributes in propNamesValue (typically Python properties) on the given obj, and return obj. The attribute/property names (JavaScript strings) and values (SkObject instances) should alternate in the propNamesValues array.
    WrapExistingCtorSpec, // Spec to indicate that we should construct a new Skulpt/Python wrapper for an existing GeoGebra object.
    SkGgbObject, // A Skulpt object which is also a wrapped GeoGebra object.
    setGgbLabelFromArgs, //Set the $ggbLabel property of the given obj from the result of assembling a GeoGebra command from the given command and args. Curried for more concise use within a constructor.
    assembledCommand,
} from "../shared";
import { SkObject, SkulptApi } from "../../shared/vendor-types/skulptapi";

import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

interface SkGgbAngle extends SkGgbObject {
    // Properties for different types of Angle calculations
    object1?: SkGgbObject; // First object (point, vector, line, etc.)
    object2?: SkGgbObject; // Second object (optional)
    object3?: SkGgbObject; // Third object (optional, for three-point angles)
    unit?: "degrees" | "radians"; // Angle unit
    result?: number; // Calculated angle result
}
// Constructor defines the method(s) to build an object in a class
// Constructor spec for the SkGgbAngle
type SkGgbAngleCtorSpec = 
    | WrapExistingCtorSpec // First option: Wrap an existing angle

    | {
        kind: "three-points"; // Three-point angle
        point1: SkGgbObject;
        apex: SkGgbObject;
        point2: SkGgbObject;
    }
    |{
        kind: "two-lines"; // Angle between 2 lines
        object1: SkGgbObject;
        object2: SkGgbObject;
    };

// Registration function
export const register = (mod: any, appApi: AppApi) => { // connects your code to Geogebra by receiving the module being registered and Geogebra application's API
    const ggb = augmentedGgbApi(appApi.ggb); // augments the basic Geogebra API by adding extra functionality

    // class definition
    const cls = Sk.abstr.buildNativeClass("Angle", {
        constructor: function Angle(
            this: SkGgbAngle, // 'this' will be an angle object
            spec: SkGgbAngleCtorSpec // specification for how to build the angle
        ) {
            // ############################################################# best to define the angle name base on the question text
            const setLabelArgs = setGgbLabelFromArgs(ggb, this, "Angle"); // function takes in 3 params, (Geogebra API, angle object, type="angle"), and creates a unique label like "A", "B","C" etc
        
            switch (spec.kind){
                case "three-points": {
                    // setLabelArgs([spec.point1.$ggbLabel, spec.apex.$ggbLabel, spec.point2.$ggbLabel]);
                    // this.object1 = spec.point1;
                    // this.object2 = spec.apex;
                    // this.object3 = spec.point2;
                    // this.unit = "degrees"; // Default to degree for DSE math

                    const ggbCmd = assembledCommand("Angle", [
                        spec.point1.$ggbLabel,
                        spec.apex.$ggbLabel,
                        spec.point2.$ggbLabel,
                      ]);
                    const lbls = ggb.evalCmd(ggbCmd);
                    const angle = ggb.getValue(lbls);
                    ggb.deleteObject(lbls);
                    
                    return new Sk.builtin.float_(angle * 180 / Math.PI);
                    // break
                }
                case 'two-lines': {
                    setLabelArgs([spec.object1.$ggbLabel, spec.object2.$ggbLabel]);
                    this.object1 = spec.object1;
                    this.object2 = spec.object2;
                    this.unit = "degrees"; // Default to degrees
                    break;
                }
                default:
                    throw new Sk.builtin.TypeError(`Invalid Angle spec kind: ${(spec as any).kind}`);
            }
        },
        slots: {
            tp$new(args, kwargs) {
                const badArgsError = new Sk.builtin.TypeError(
                    "Angle() arguments are invalid for the given input types."
                );

                const make = (spec: SkGgbAngleCtorSpec) =>
                    withPropertiesFromNameValuePairs(new mod.Angle(spec), kwargs);

                // Detecting input types
                if (args.length === 3 && ggb.everyElementIsGgbObjectOfType(args, "point")) {
                    return make({
                        kind: "three-points",
                        point1: args[0],
                        apex: args[1],
                        point2: args[2],
                    });
                } else if (args.length === 2 && ggb.everyElementIsGgbObject(args)) {
                    return make({
                        kind: "two-lines",
                        object1: args[0],
                        object2: args[1],
                    });
                }

                throw badArgsError;
            },
        },
        methods:{
            // Method to return the angle result
            get_angle(this: SkGgbAngle) {
                return this.result
                    ? new Sk.builtin.float_(this.result)
                    : Sk.builtin.none.none$;
            },
        },
        getsets: {
            is_visible: ggb.sharedGetSets.is_visible,
            color: ggb.sharedGetSets.color,
            color_floats: ggb.sharedGetSets.color_floats,
            _ggb_type: ggb.sharedGetSets._ggb_type,
        },
    });

    mod.Angle = cls;
    registerObjectType("angle", cls);
};