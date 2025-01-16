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

interface SkGgbAreCongruent extends SkGgbObject {  // AreCongruent structure
    object1: SkGgbObject;
    object2: SkGgbObject;
    result?: boolean; // True if congruent, otherwise false
}

type SkGgbAreCongruentCtorSpec = { // input structure
    object1: SkGgbObject;
    object2: SkGgbObject;
};

// Registration function
export const register = (mod: any, appApi: AppApi) => {
    const ggb = augmentedGgbApi(appApi.ggb);

    const cls = Sk.abstr.buildNativeClass("AreCongruent", {
        constructor: function AreCongruent(
            this: SkGgbAreCongruent,
            spec: SkGgbAreCongruentCtorSpec
        ) {
            this.object1 = spec.object1; // Assign object1 from the input spec
            this.object2 = spec.object2; // Assign object2 from the input spec

            // Construct the GeoGebra AreCongruent command
            const congruentCommand = assembledCommand("AreCongruent", [
                this.object1.$ggbLabel,
                this.object2.$ggbLabel,
            ]);

            // Evaluate the AreCongruent command in GeoGebra
            const result = ggb.getValue(ggb.evalCmd(congruentCommand));
            if (result === 1) {
                this.result = true;
            } else if (result === 0) {
                this.result = false;
            } else {
                throw new Sk.builtin.TypeError("AreCongruent Result neither true nor false, pending fix")
            }

            // Prepare and return the result message
            const message = this.result
                ? `Objects are congruent.`
                : `Objects are NOT congruent.`;
            return new Sk.builtin.str(message);
        },
        slots: {
            tp$new(args, kwargs) {
                const badArgsError = new Sk.builtin.TypeError(
                    "AreCongruent() requires exactly 2 objects."
                );

                const make = (spec: SkGgbAreCongruentCtorSpec) =>
                    withPropertiesFromNameValuePairs(new mod.AreCongruent(spec), kwargs);

                if (args.length === 2 && ggb.everyElementIsGgbObject(args)) {
                    return make({
                        object1: args[0],
                        object2: args[1],
                    });
                }

                throw badArgsError;
            },
            tp$repr(this: SkGgbAreCongruent) { // Developer-side representation
                return new Sk.builtin.str(
                    this.result ? "AreCongruent: true" : "AreCongruent: false"
                );
            },
        },
        methods: {
            // Method to return congruence result
            is_congruent(this: SkGgbAreCongruent) {
                return this.result
                    ? Sk.builtin.bool.true$
                    : Sk.builtin.bool.false$;
            },
        },
        getsets: {
            // Getter for the congruence result
            result: {
                get(this: SkGgbAreCongruent) {
                    return this.result
                        ? Sk.builtin.bool.true$
                        : Sk.builtin.bool.false$;
                },
            },
        },
    });

    mod.AreCongruent = cls;
    registerObjectType("are_congruent", cls);
};