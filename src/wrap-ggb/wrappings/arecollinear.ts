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

interface SkGgbAreCollinear extends SkGgbObject { // AreCollinear structure
    point1: SkGgbObject;
    point2: SkGgbObject;
    point3: SkGgbObject;
    result?: boolean; // True if collinear, otherwise false
}

type SkGgbAreCollinearCtorSpec = { // Input structure
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
            this.point1 = spec.point1; // Assign point1 from the input spec
            this.point2 = spec.point2; // Assign point2 from the input spec
            this.point3 = spec.point3; // Assign point3 from the input spec

            // Construct the GeoGebra AreCollinear command
            const collinearCommand = assembledCommand("AreCollinear", [
                this.point1.$ggbLabel,
                this.point2.$ggbLabel,
                this.point3.$ggbLabel,
            ]);

            // Evaluate the AreCollinear command in GeoGebra
            const result = ggb.getValue(ggb.evalCmd(collinearCommand));
            if (result === 1) {
                this.result = true;
            } else if (result === 0) {
                this.result = false;
            } else {
                throw new Sk.builtin.TypeError("AreCollinear result is neither true nor false, pending fix");
            }

            // Prepare and return the result message
            const message = this.result
                ? `Points ${this.point1.$ggbLabel}, ${this.point2.$ggbLabel}, and ${this.point3.$ggbLabel} are collinear.`
                : `Points ${this.point1.$ggbLabel}, ${this.point2.$ggbLabel}, and ${this.point3.$ggbLabel} are NOT collinear.`;
            return new Sk.builtin.str(message);
        },
        slots: {
            tp$new(args, kwargs) {
                const badArgsError = new Sk.builtin.TypeError(
                    "AreCollinear() requires exactly 3 points."
                );

                const make = (spec: SkGgbAreCollinearCtorSpec) =>
                    withPropertiesFromNameValuePairs(new mod.AreCollinear(spec), kwargs);

                if (
                    args.length === 3 &&
                    ggb.everyElementIsGgbObjectOfType(args, "point")
                ) {
                    return make({
                        point1: args[0],
                        point2: args[1],
                        point3: args[2],
                    });
                }

                throw badArgsError;
            },
            tp$repr(this: SkGgbAreCollinear) { // Developer-side representation
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