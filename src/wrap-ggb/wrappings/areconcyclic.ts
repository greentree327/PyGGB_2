import { AppApi } from "../../shared/appApi";
import {
    augmentedGgbApi,
    withPropertiesFromNameValuePairs,
    SkGgbObject,
    setGgbLabelFromArgs,
    assembledCommand,
} from "../shared";

import { SkObject, SkulptApi } from "../../shared/vendor-types/skulptapi";

import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

interface SkGgbAreConcyclic extends SkGgbObject {  // AreConcyclic structure

    point1: SkGgbObject;
    point2: SkGgbObject;
    point3: SkGgbObject;
    point4: SkGgbObject;
    result?: boolean; // True if concyclic, otherwise false

}

type SkGgbAreConcyclicCtorSpec = { // input structure
    point1: SkGgbObject;
    point2: SkGgbObject;
    point3: SkGgbObject;
    point4: SkGgbObject;
};

// Registration function
export const register = (mod: any, appApi: AppApi) => {
    const ggb = augmentedGgbApi(appApi.ggb);

    const cls = Sk.abstr.buildNativeClass("AreConcyclic", {
        constructor: function AreConcyclic(
            this: SkGgbAreConcyclic,
            spec: SkGgbAreConcyclicCtorSpec
        ) {
            this.point1 = spec.point1; // 'this' refers to the current instance of the class (AreConcyclic class)
            this.point2 = spec.point2;
            this.point3 = spec.point3; // It assigns point3 from the input(spec) to this class point3 parameter
            this.point4 = spec.point4;
            
            /* 
            // ALso draws the angle on Geogebra WebApp, can use this to double check on the angle
            
            const polygon_method = assembledCommand("Polygon", [ // evalCmd returns a string
                this.point1.$ggbLabel, // 'this' refers to the current instance of the class (AreConcyclic class)
                this.point2.$ggbLabel,
                this.point3.$ggbLabel, // It assigns point3 from the input(spec) to this class point3 parameter
                this.point4.$ggbLabel
            ])

            ggb.evalCmd(`Angle(${polygon_method})`);
            */

            // Helper function to compute angle between two segments
            const computeAngle = (pointA:SkGgbObject, pointB:SkGgbObject, pointC:SkGgbObject) => {
                const segment1 = assembledCommand("Segment", [pointA.$ggbLabel, pointB.$ggbLabel]);
                const segment2 = assembledCommand("Segment", [pointA.$ggbLabel, pointC.$ggbLabel]);
                const angleRadian = ggb.getValue(ggb.evalCmd(assembledCommand("Angle", [segment1, segment2])));
                return angleRadian * (180 / Math.PI); // Convert to degrees
            };

            // Compute angles for each vertex
            const angle1 = computeAngle(this.point1, this.point2, this.point4);
            const angle2 = computeAngle(this.point2, this.point3, this.point1);
            const angle3 = computeAngle(this.point3, this.point4, this.point2);
            const angle4 = computeAngle(this.point4, this.point1, this.point3);
            

            // Check if the sum of angles is supplementary (180°)
            const sumAngles13 = angle1 + angle3;
            const sumAngles24 = angle2 + angle4;
            // Generate unique label using point labels and result
            const uniqueLabel = `ConcyclicResult_${this.point1.$ggbLabel}_${this.point2.$ggbLabel}_${this.point3.$ggbLabel}_${this.point4.$ggbLabel}`;

            if (sumAngles13 === 180){ 
                this.result = true; // Opposite Angles of a Cyclic Quadrilateral Theorem

                // Create Geogebra Object with the label CollinearResult_A_B_C, and assign it with the value of this.result
                ggb.evalCmd(`${uniqueLabel} = ${this.result}`);

                // Prepare and return 'message' at web display
                const message = `Points ${this.point1.$ggbLabel}, ${this.point2.$ggbLabel}, ${this.point3.$ggbLabel} and ${this.point4.$ggbLabel} are concyclic. \n Opposite angles in a cyclic quadrilateral sum to 180°: ${this.point1.$ggbLabel} + ${this.point3.$ggbLabel} = ${sumAngles13}, ${this.point2.$ggbLabel} + ${this.point4.$ggbLabel} = ${sumAngles24}`;
                return new Sk.builtin.str(message);
            } else {
                this.result = false;
                ggb.evalCmd(`${uniqueLabel} = ${this.result}`);
                const message = `Points ${this.point1.$ggbLabel}, ${this.point2.$ggbLabel}, ${this.point3.$ggbLabel} and ${this.point4.$ggbLabel} are NOT concyclic. \n Opposite angles in a cyclic quadrilateral should sum up to 180°: ${this.point1.$ggbLabel} + ${this.point3.$ggbLabel} = ${sumAngles13},${this.point2.$ggbLabel} + ${this.point4.$ggbLabel} = ${sumAngles24}`;
                return new Sk.builtin.str(message);
            }
            
        },
        slots: {
            tp$new(args, kwargs) {
                const badArgsError = new Sk.builtin.TypeError(
                    "AreConcyclic() requires exactly 4 points."
                );

                const make = (spec: SkGgbAreConcyclicCtorSpec) =>
                    withPropertiesFromNameValuePairs(new mod.AreConcyclic(spec), kwargs);

                if (args.length === 4 && ggb.everyElementIsGgbObjectOfType(args, "point")) {
                    // return new Sk.builtin.str("Hello");
                    return make({  
                        point1: args[0],
                        point2: args[1],
                        point3: args[2],
                        point4: args[3],
                    });
                }

                throw badArgsError;
            },
            tp$repr(this: SkGgbAreConcyclic) { // developer side
                return new Sk.builtin.str(
                    this.result ? "AreConcyclic: true" : "AreConcyclic: false" // if this.result is true, then return true, else otherwise
                );
            },
        },
        methods: {
            // Method to return collinearity result
            is_collinear(this: SkGgbAreConcyclic) {
                return this.result
                    ? Sk.builtin.bool.true$
                    : Sk.builtin.bool.false$;
            },
        },
        getsets: {
            // Getter for the collinearity result
            result: {
                get(this: SkGgbAreConcyclic) {
                    return this.result
                        ? Sk.builtin.bool.true$
                        : Sk.builtin.bool.false$;
                },
            },
        },
    });

    mod.AreConcyclic = cls;
    registerObjectType("are_concyclic", cls);
}