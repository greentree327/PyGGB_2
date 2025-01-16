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
            this.point1 = spec.point1;
            this.point2 = spec.point2;
            this.point3 = spec.point3;
            this.point4 = spec.point4;

            // Construct the GeoGebra AreConcyclic command
            const concyclicCommand = assembledCommand("AreConcyclic", [
                this.point1.$ggbLabel,
                this.point2.$ggbLabel,
                this.point3.$ggbLabel,
                this.point4.$ggbLabel,
            ]);

            // Evaluate the AreConcyclic command in GeoGebra
            const result = ggb.getValue(ggb.evalCmd(concyclicCommand));
            if (result === 1) {
                this.result = true;
            } else if (result === 0) {
                this.result = false;
            } else {
                throw new Sk.builtin.TypeError("AreConcyclic result is neither true nor false, pending fix");
            }

            // Helper function to compute angle between two segments
            const computeAngle = (pointA: SkGgbObject, pointB: SkGgbObject, pointC: SkGgbObject) => {
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

            // Check if the opposite angles are supplementary (180°)
            const sumAngles13 = angle1 + angle3;
            const sumAngles24 = angle2 + angle4;

            // Visual aid: Draw the cyclic quadrilateral and angles in GeoGebra
            ggb.evalCmd(
                assembledCommand("Polygon", [
                    this.point1.$ggbLabel,
                    this.point2.$ggbLabel,
                    this.point3.$ggbLabel,
                    this.point4.$ggbLabel,
                ])
            );

            // Return a message explaining the result
            const message = this.result
                ? `Points ${this.point1.$ggbLabel}, ${this.point2.$ggbLabel}, ${this.point3.$ggbLabel}, and ${this.point4.$ggbLabel} are concyclic. Opposite angles sum to 180°: (${angle1.toFixed(
                      2
                  )} + ${angle3.toFixed(2)}) = ${sumAngles13.toFixed(2)}, (${angle2.toFixed(
                      2
                  )} + ${angle4.toFixed(2)}) = ${sumAngles24.toFixed(2)}`
                : `Points ${this.point1.$ggbLabel}, ${this.point2.$ggbLabel}, ${this.point3.$ggbLabel}, and ${this.point4.$ggbLabel} are NOT concyclic. Opposite angles do not sum to 180°: (${angle1.toFixed(
                      2
                  )} + ${angle3.toFixed(2)}) = ${sumAngles13.toFixed(2)}, (${angle2.toFixed(
                      2
                  )} + ${angle4.toFixed(2)}) = ${sumAngles24.toFixed(2)}`;
            return new Sk.builtin.str(message);
        },
        slots: {
            tp$new(args, kwargs) {
                const badArgsError = new Sk.builtin.TypeError(
                    "AreConcyclic() requires exactly 4 points."
                );

                const make = (spec: SkGgbAreConcyclicCtorSpec) =>
                    withPropertiesFromNameValuePairs(new mod.AreConcyclic(spec), kwargs);

                if (args.length === 4 && ggb.everyElementIsGgbObjectOfType(args, "point")) {
                    return make({
                        point1: args[0],
                        point2: args[1],
                        point3: args[2],
                        point4: args[3],
                    });
                }

                throw badArgsError;
            },
            tp$repr(this: SkGgbAreConcyclic) { // Developer-side representation
                return new Sk.builtin.str(
                    this.result ? "AreConcyclic: true" : "AreConcyclic: false"
                );
            },
        },
        methods: {
            // Method to return concyclicity result
            is_concyclic(this: SkGgbAreConcyclic) {
                return this.result
                    ? Sk.builtin.bool.true$
                    : Sk.builtin.bool.false$;
            },
        },
        getsets: {
            // Getter for the concyclicity result
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
};