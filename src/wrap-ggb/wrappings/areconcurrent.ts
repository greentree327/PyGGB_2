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

interface SkGgbAreConcurrent extends SkGgbObject { // AreConcurrent structure
    object1: SkGgbObject;
    object2: SkGgbObject;
    object3: SkGgbObject;
    result?: boolean; // True if concurrent, otherwise false
}

type SkGgbAreConcurrentCtorSpec = { // input structure
    object1: SkGgbObject;
    object2: SkGgbObject;
    object3: SkGgbObject;
};

// Registration function
export const register = (mod: any, appApi: AppApi) => {
    const ggb = augmentedGgbApi(appApi.ggb);

    const cls = Sk.abstr.buildNativeClass("AreConcurrent", {
        constructor: function AreConcurrent(
            this: SkGgbAreConcurrent,
            spec: SkGgbAreConcurrentCtorSpec
        ) {
            this.object1 = spec.object1; // Assign object1 from the input spec
            this.object2 = spec.object2; // Assign object2 from the input spec
            this.object3 = spec.object3; // Assign object3 from the input spec

            // Construct the GeoGebra AreConcurrent command
            const concurrentCommand = assembledCommand("AreConcurrent", [
                this.object1.$ggbLabel,
                this.object2.$ggbLabel,
                this.object3.$ggbLabel,
            ]);

            // Evaluate the AreConcurrent command in GeoGebra
            const result = ggb.getValue(ggb.evalCmd(concurrentCommand));
            if (result === 1) {
                this.result = true;
            } else if (result === 0) {
                this.result = false;
            } else {
                throw new Sk.builtin.TypeError("AreConcurrent result is neither true nor false, pending fix");
            }

            // Prepare and return the result message
            const message = this.result
                ? `Lines are concurrent.`
                : `Lines are NOT concurrent.`;
            return new Sk.builtin.str(message);
        },
        slots: {
            tp$new(args, kwargs) {
                const badArgsError = new Sk.builtin.TypeError(
                    "AreConcurrent() requires exactly 3 objects, each either a line or a segment."
                );

                const make = (spec: SkGgbAreConcurrentCtorSpec) =>
                    withPropertiesFromNameValuePairs(new mod.AreConcurrent(spec), kwargs);

                // Check if exactly 3 arguments are provided and all are lines
                if (
                    args.length === 3 &&
                    (ggb.isGgbObjectOfType(args[0], "line") || ggb.isGgbObjectOfType(args[0], "segment")) &&
                    (ggb.isGgbObjectOfType(args[1], "line") || ggb.isGgbObjectOfType(args[1], "segment")) &&
                    (ggb.isGgbObjectOfType(args[2], "line") || ggb.isGgbObjectOfType(args[2], "segment")) 
                ) {
                    return make({
                        object1: args[0],
                        object2: args[1],
                        object3: args[2],
                    });
                }

                throw badArgsError;
            },
            tp$repr(this: SkGgbAreConcurrent) { // Developer-side representation
                return new Sk.builtin.str(
                    this.result ? "AreConcurrent: true" : "AreConcurrent: false"
                );
            },
        },
        methods: {
            // Method to return concurrency result
            is_concurrent(this: SkGgbAreConcurrent) {
                return this.result
                    ? Sk.builtin.bool.true$
                    : Sk.builtin.bool.false$;
            },
        },
        getsets: {
            // Getter for the concurrency result
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