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

declare var Sk: SkulptApi; // declares a global variable named Sk of type SkulptApi

interface SkGgbAreConcurrent extends SkGgbObject {
    // Input lines
    line1: SkGgbObject;
    line2: SkGgbObject;
    line3: SkGgbObject;
    result?: boolean; // Result of the concurrency check
}

// Constructor spec for AreConcurrent
type SkGgbAreConcurrentCtorSpec = {
    line1: SkGgbObject;
    line2: SkGgbObject;
    line3: SkGgbObject;
};

// Registration function
export const register = (mod: any, appApi: AppApi) => {
    const ggb = augmentedGgbApi(appApi.ggb);

    const cls = Sk.abstr.buildNativeClass("AreConcurrent", {
        constructor: function AreConcurrent(
            this: SkGgbAreConcurrent, 
            spec: SkGgbAreConcurrentCtorSpec
        ) {
            // const setLabelArgs = setGgbLabelFromArgs(ggb, this, "AreConcurrent");

            // Set the points and calculate the result
            // setLabelArgs([spec.line1.$ggbLabel, spec.line2.$ggbLabel, spec.line3.$ggbLabel]);

            // Store input lines
            this.line1 = spec.line1;
            this.line2 = spec.line2;
            this.line3 = spec.line3;
            // return new Sk.builtin.str(spec.line1.$ggbLabel)
            
            const computeIntersections = (cmd : string): string => {
                const rawResults = ggb.evalCmdMultiple(cmd);
                const filteredResults = rawResults.filter((item) => item !== null && item !== 'null'); // Filter out null and "null"

                if (Array.isArray(filteredResults)) {
                    const result = filteredResults.map((item) => ggb.wrapExistingGgbObject(item));
                    return result.join(", ");
                } else if ( typeof filteredResults === 'string') {
                    return filteredResults;
                } else {
                    throw new Error(`Unexpected return type: ${typeof filteredResults}`);
                }
            };


            // Compute concurrency
            const intersect1Cmd = assembledCommand("Intersect", [
                this.line1.$ggbLabel, // i
                this.line2.$ggbLabel
            ]);

            const intersect2Cmd = assembledCommand("Intersect", [
                this.line2.$ggbLabel,
                this.line3.$ggbLabel
            ]);

            let intersectingPoint1, intersectingPoint2;

            try {
                intersectingPoint1 = computeIntersections(intersect1Cmd);
                intersectingPoint2 = computeIntersections(intersect2Cmd);
            } catch (error) {
                return new Sk.builtin.str("Error: Failed to compute intersections.");
            }
            
            // Generate unique label using the lines
            const uniqueLabel = `ConcurrentResult_${this.line1.$ggbLabel}_${this.line2.$ggbLabel}_${this.line3.$ggbLabel}`;
            
            // Check if both intersections exist 
            if (intersectingPoint1 && intersectingPoint2) {
                // Check if both intersections match
                if (intersectingPoint1 === intersectingPoint2) {

                    this.result = true; // points are collinear

                    // Create Geogebra Object with the label ConcurrentResult_line1_line2_line3, and assign it with the value of this.result
                    ggb.evalCmd(`${uniqueLabel} = ${this.result}`);

                    // Prepare and return 'message' at web display
                    const message = `Line ${this.line1.$ggbLabel}, ${this.line2.$ggbLabel}, and ${this.line3.$ggbLabel} are concurrent.`;
                    return new Sk.builtin.str(message);
                } else { // both intersections do not match
                    this.result = false;
                    ggb.evalCmd(`${uniqueLabel} = ${this.result}`);
                    const message = `Line ${this.line1.$ggbLabel}, ${this.line2.$ggbLabel}, and ${this.line3.$ggbLabel} are NOT concurrent.`;
                    return new Sk.builtin.str(message);
                }
            } else { // intersection point(s) don't exist
                const message = `One or more intersection point(s) don't exist`;
                return new Sk.builtin.str(message);
            }
            
        },
        slots: {
            tp$new(args, kwargs) {
                const badArgsError = new Sk.builtin.TypeError(
                    "AreConcurrent() requires three line inputs."
                );

                const make = (spec: SkGgbAreConcurrentCtorSpec) =>
                                    withPropertiesFromNameValuePairs(new mod.AreConcurrent(spec), kwargs);

                if (args.length === 3 && ggb.everyElementIsGgbObjectOfType(args, "line")) {
                    // return new Sk.builtin.str(args[0].$ggbLabel);
                    
                    return make({  
                        line1: args[0],
                        line2: args[1],
                        line3: args[2],
                    }); 
                    
                }

                throw badArgsError;
            },
            tp$repr(this: SkGgbAreConcurrent) {
                return new Sk.builtin.str(
                    this.result ? "AreConcurrent: true" : "AreConcurrent: false"
                );
            },
        },
        methods: {
            // Method to return collinearity result
            is_collinear(this: SkGgbAreConcurrent) {
                return this.result
                    ? Sk.builtin.bool.true$
                    : Sk.builtin.bool.false$;
            },
        },
        getsets: {
            // Getter for the collinearity result
            result: {
                get(this: SkGgbAreConcurrent) {
                    return this.result
                        ? Sk.builtin.bool.true$
                        : Sk.builtin.bool.false$;
                },
            },
        },

    });
mod.AreConcurrent = cls;
registerObjectType("are_concurrent", cls);

};
