import { AppApi } from "../../shared/appApi";
import {
    augmentedGgbApi,
    withPropertiesFromNameValuePairs,
    SkGgbObject,
    setGgbLabelFromArgs,
} from "../shared";

import { SkObject, SkulptApi } from "../../shared/vendor-types/skulptapi";

import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

interface SkGgbAreCollinear extends SkGgbObject {

    point1: SkGgbObject;
    point2: SkGgbObject;
    point3: SkGgbObject;
    result?: boolean; // True if collinear, otherwise false

}

// Constructor spec for `AreCollinear`
type SkGgbAreCollinearCtorSpec = {
    point1: SkGgbObject;
    point2: SkGgbObject;
    point3: SkGgbObject;
};

// Registration function
export const register = (mod: any, appApi: AppApi) => {
    const ggb = augmentedGgbApi(appApi.ggb);

    const cls = Sk.abstr.buildNativeClass("AreCollinear", {
        constructor: function AreCollinear(
            this: SkGgbAreCollinear,
            spec: SkGgbAreCollinearCtorSpec
        ) {
            const setLabelArgs = setGgbLabelFromArgs(ggb, this, "AreCollinear");

            // Set the points and calculate the result
            setLabelArgs([spec.point1.$ggbLabel, spec.point2.$ggbLabel, spec.point3.$ggbLabel]);

            this.point1 = spec.point1;
            this.point2 = spec.point2;
            this.point3 = spec.point3;

            // Fetch coordinates using GeoGebra API
            const x1 = ggb.getXcoord(this.point1.$ggbLabel);
            const y1 = ggb.getYcoord(this.point1.$ggbLabel);
            const x2 = ggb.getXcoord(this.point2.$ggbLabel);
            const y2 = ggb.getYcoord(this.point2.$ggbLabel);
            const x3 = ggb.getXcoord(this.point3.$ggbLabel);
            const y3 = ggb.getYcoord(this.point3.$ggbLabel);
            
            // Calculate the determinant
            const determinant = x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)

            // Generate unique label using point labels and result
            const uniqueLabel = `CollinearResult_${this.point1.$ggbLabel}_${this.point2.$ggbLabel}_${this.point3.$ggbLabel}`;

            if (determinant === 0){
                this.result = true; // points are collinear

                // Create Geogebra Object with the label CollinearResult_A_B_C, and assign it with the value of this.result
                ggb.evalCmd(`${uniqueLabel} = ${this.result}`) 

                // Prepare and return 'message' at web display
                const message = `Points ${this.point1.$ggbLabel}, ${this.point2.$ggbLabel}, and ${this.point3.$ggbLabel} are collinear.`;
                return new Sk.builtin.str(message) 
                
            } else {
                this.result = false; // points are not collinear
                ggb.evalCmd(`${uniqueLabel} = ${this.result}`) 
                const message = `Points ${this.point1.$ggbLabel}, ${this.point2.$ggbLabel}, and ${this.point3.$ggbLabel} are not collinear.`;
                return new Sk.builtin.str(message);
            }            
            
        },
        slots: {
            tp$new(args, _kwargs) {
                const badArgsError = new Sk.builtin.TypeError(
                    "AreCollinear() requires exactly 3 points."
                );
                
                const make = (spec: SkGgbAreCollinearCtorSpec) =>
                    withPropertiesFromNameValuePairs(new mod.AreCollinear(spec), _kwargs);

                if (args.length === 3 && ggb.everyElementIsGgbObjectOfType(args, "point")) {
                    // return new Sk.builtin.str("Hello");
                    return make({  
                        point1: args[0],
                        point2: args[1],
                        point3: args[2],
                    });
                }
        
                throw badArgsError;
            },
            tp$repr(this: SkGgbAreCollinear) {
                return new Sk.builtin.str(
                    this.result ? "AreCollinear: true" : "AreCollinear: false"
                );
            },

        },
        methods: {
            // Method to return collinearity result
            is_collinear(this: SkGgbAreCollinear) {
                return this.result
                    ? Sk.builtin.bool.true$
                    : Sk.builtin.bool.false$;
            },
        },
        getsets: {
            // Getter for the collinearity result
            result: {
                get(this: SkGgbAreCollinear) {
                    return this.result
                        ? Sk.builtin.bool.true$
                        : Sk.builtin.bool.false$;
                },
            },
        },
    });

    mod.AreCollinear = cls;
    registerObjectType("are_collinear", cls);
};
