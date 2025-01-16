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

interface SkGgbArePerpendicular extends SkGgbObject { // ArePerpendicular structure
    object1: SkGgbObject;
    object2: SkGgbObject;
    result?: boolean; // True if perpendicular, otherwise false
}

type SkGgbArePerpendicularCtorSpec = { // Input structure
    object1: SkGgbObject;
    object2: SkGgbObject;
};

// Registration function
export const register = (mod: any, appApi: AppApi) => {
    const ggb = augmentedGgbApi(appApi.ggb);

    const cls = Sk.abstr.buildNativeClass("ArePerpendicular", {
        constructor: function ArePerpendicular(
            this: SkGgbArePerpendicular,
            spec: SkGgbArePerpendicularCtorSpec
        ) {
            this.object1 = spec.object1; // Assign object1 from the input spec
            this.object2 = spec.object2; // Assign object2 from the input spec

            // Construct the GeoGebra ArePerpendicular command
            const perpendicularCommand = assembledCommand("ArePerpendicular", [
                this.object1.$ggbLabel,
                this.object2.$ggbLabel,
            ]);

            // Evaluate the ArePerpendicular command in GeoGebra
            const result = ggb.getValue(ggb.evalCmd(perpendicularCommand));
            if (result === 1) {
                this.result = true;
            } else if (result === 0) {
                this.result = false;
            } else {
                throw new Sk.builtin.TypeError("ArePerpendicular result is neither true nor false, pending fix");
            }

            // Prepare and return the result message
            const message = this.result
                ? `Lines are perpendicular.`
                : `Lines are NOT perpendicular.`;
            return new Sk.builtin.str(message);
        },
        slots: {
            tp$new(args, kwargs) {
                const badArgsError = new Sk.builtin.TypeError(
                    "ArePerpendicular() requires exactly 2 objects, each either a line or a segment."
                );

                const make = (spec: SkGgbArePerpendicularCtorSpec) =>
                    withPropertiesFromNameValuePairs(new mod.ArePerpendicular(spec), kwargs);

                if (
                    args.length === 2 &&
                    (ggb.isGgbObjectOfType(args[0], "line") || ggb.isGgbObjectOfType(args[0], "segment")) &&
                    (ggb.isGgbObjectOfType(args[1], "line") || ggb.isGgbObjectOfType(args[1], "segment"))
                ) {
                    return make({
                        object1: args[0],
                        object2: args[1],
                    });
                }

                throw badArgsError;
            },
            tp$repr(this: SkGgbArePerpendicular) { // Developer-side representation
                return new Sk.builtin.str(
                    this.result ? "ArePerpendicular: true" : "ArePerpendicular: false"
                );
            },
        },
        methods: {
            // Method to return perpendicularity result
            is_perpendicular(this: SkGgbArePerpendicular) {
                return this.result
                    ? Sk.builtin.bool.true$
                    : Sk.builtin.bool.false$;
            },
        },
        getsets: {
            // Getter for the perpendicularity result
            result: {
                get(this: SkGgbArePerpendicular) {
                    return this.result
                        ? Sk.builtin.bool.true$
                        : Sk.builtin.bool.false$;
                },
            },
        },
    });

    mod.ArePerpendicular = cls;
    registerObjectType("are_perpendicular", cls);
};