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

interface SkGgbAreEqual extends SkGgbObject {  // AreEqual structure
    object1: SkGgbObject;
    object2: SkGgbObject;
    result?: boolean; // True if equal, otherwise false
}

type SkGgbAreEqualCtorSpec = { // input structure
    object1: SkGgbObject;
    object2: SkGgbObject;
};

// Registration function
export const register = (mod: any, appApi: AppApi) => {
    const ggb = augmentedGgbApi(appApi.ggb);

    const cls = Sk.abstr.buildNativeClass("AreEqual", {
        constructor: function AreEqual( // Two objects are equal if they are identical in all respects (Size, shape, position, and orientation)
            this: SkGgbAreEqual,
            spec: SkGgbAreEqualCtorSpec
        ) {
            this.object1 = spec.object1; // Assign object1 from the input spec
            this.object2 = spec.object2; // Assign object2 from the input spec

            // Construct the GeoGebra AreEqual command
            const equalCommand = assembledCommand("AreEqual", [
                this.object1.$ggbLabel,
                this.object2.$ggbLabel,
            ]);

            // Evaluate the AreEqual command in GeoGebra
            const result = ggb.getValue(ggb.evalCmd(equalCommand));
            if (result === 1) {
                this.result = true;
            } else if (result === 0) {
                this.result = false;
            } else {
                throw new Sk.builtin.TypeError("AreEqual Result neither true nor false, pending fix")
            }

            // Prepare and return the result message
            const message = this.result
                ? `Objects are equal.`
                : `Objects are NOT equal.`;
            return new Sk.builtin.str(message);
        },
        slots: {
            tp$new(args, kwargs) {
                const badArgsError = new Sk.builtin.TypeError(
                    "AreEqual() requires exactly 2 objects."
                );

                const make = (spec: SkGgbAreEqualCtorSpec) =>
                    withPropertiesFromNameValuePairs(new mod.AreEqual(spec), kwargs);

                if (args.length === 2 && ggb.everyElementIsGgbObject(args)) {
                    return make({
                        object1: args[0],
                        object2: args[1],
                    });
                }

                throw badArgsError;
            },
            tp$repr(this: SkGgbAreEqual) { // Developer-side representation
                return new Sk.builtin.str(
                    this.result ? "AreEqual: true" : "AreEqual: false"
                );
            },
        },
        methods: {
            // Method to return equality result
            is_equal(this: SkGgbAreEqual) {
                return this.result
                    ? Sk.builtin.bool.true$
                    : Sk.builtin.bool.false$;
            },
        },
        getsets: {
            // Getter for the equality result
            result: {
                get(this: SkGgbAreEqual) {
                    return this.result
                        ? Sk.builtin.bool.true$
                        : Sk.builtin.bool.false$;
                },
            },
        },
    });

    mod.AreEqual = cls;
    registerObjectType("are_equal", cls);
};