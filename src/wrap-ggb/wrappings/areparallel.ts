import { AppApi } from "../../shared/appApi";
import {
    augmentedGgbApi,
    withPropertiesFromNameValuePairs,
    SkGgbObject,
    assembledCommand,
} from "../shared";

import { SkObject, SkulptApi } from "../../shared/vendor-types/skulptapi";

import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

interface SkGgbAreParallel extends SkGgbObject {  // AreParallel structure
    object1: SkGgbObject;
    object2: SkGgbObject;
    result?: boolean; // True if parallel, otherwise false
}

type SkGgbAreParallelCtorSpec = { // input structure
    object1: SkGgbObject;
    object2: SkGgbObject;
};

// Registration function
export const register = (mod: any, appApi: AppApi) => {
    const ggb = augmentedGgbApi(appApi.ggb);

    const cls = Sk.abstr.buildNativeClass("AreParallel", {
        constructor: function AreParallel( // Two lines are parallel if they have the same slope
            this: SkGgbAreParallel,
            spec: SkGgbAreParallelCtorSpec
        ) {
            this.object1 = spec.object1; // Assign object1 from the input spec
            this.object2 = spec.object2; // Assign object2 from the input spec

            // Construct the GeoGebra AreParallel command
            const parallelCommand = assembledCommand("AreParallel", [
                this.object1.$ggbLabel,
                this.object2.$ggbLabel,
            ]);

            // Evaluate the AreParallel command in GeoGebra
            const result = ggb.getValue(ggb.evalCmd(parallelCommand));
            if (result === 1) {
                this.result = true;
            } else if (result === 0) {
                this.result = false;
            } else {
                throw new Sk.builtin.TypeError("AreParallel Result neither true nor false, pending fix")
            }

            // Prepare and return the result message
            const message = this.result
                ? `Lines are parallel.`
                : `Lines are NOT parallel.`;
            return new Sk.builtin.str(message);
        },
        slots: {
            tp$new(args, kwargs) {
                const badArgsError = new Sk.builtin.TypeError(
                    "AreParallel() requires exactly 2 lines or segments."
                );

                const make = (spec: SkGgbAreParallelCtorSpec) =>
                    withPropertiesFromNameValuePairs(new mod.AreParallel(spec), kwargs);

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
            tp$repr(this: SkGgbAreParallel) { // Developer-side representation
                return new Sk.builtin.str(
                    this.result ? "AreParallel: true" : "AreParallel: false"
                );
            },
        },
        methods: {
            // Method to return parallelism result
            is_parallel(this: SkGgbAreParallel) {
                return this.result
                    ? Sk.builtin.bool.true$
                    : Sk.builtin.bool.false$;
            },
        },
        getsets: {
            // Getter for the parallelism result
            result: {
                get(this: SkGgbAreParallel) {
                    return this.result
                        ? Sk.builtin.bool.true$
                        : Sk.builtin.bool.false$;
                },
            },
        },
    });

    mod.AreParallel = cls;
    registerObjectType("are_parallel", cls);
};