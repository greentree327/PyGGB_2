import { AppApi } from "../../shared/appApi";
import { ggbCompare } from "../operations";
import {AugmentedGgbApi,augmentedGgbApi,SkGgbObject} from "../shared";
import { SkulptApi, SkObject, KeywordArgsArray } from "../../shared/vendor-types/skulptapi";
import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

// Wrapper for GeoGebra functions (like sin, cos, etc.)
const functionWrapper = (ggb: AugmentedGgbApi, ggbName: string) => {
  return {
    $meth(x: SkGgbObject) {
      // Build the GeoGebra command
      const ggbCmd = `${ggbName}(${x.$ggbLabel})`;
      // Evaluate the command in GeoGebra and wrap the resulting object
      const label = ggb.evalCmd(ggbCmd);
      return ggb.wrapExistingGgbObject(label);
    },
    $flags: { OneArg: true }, // Specify that the function takes one argument
  };
};

// Register the MathOperations class
export const register = (mod: any, appApi: AppApi) => {
  const ggbApi = appApi.ggb;
  const ggb = augmentedGgbApi(appApi.ggb);

  // Define the MathOperations class
  const cls = Sk.abstr.buildNativeClass("MathOperations", {
    constructor: function MathOperations() {},

    // Define methods for MathOperations
    classmethods: {
      // Trigonometric functions
      sin: functionWrapper(ggb, "sin"),
      cos: functionWrapper(ggb, "cos"),

      // Comparison operation
      compare_LT: {
        $flags: { FastCall: true },
        $meth(args: Array<SkObject>, _kwargs: KeywordArgsArray) {
          // Compare two GeoGebra objects using the "<" operator
          return ggbCompare(ggbApi, args[0], args[1], "<");
        },
      },
    },

    // Optional slots for initializing or validating inputs
    slots: {
      tp$new(args: Array<SkObject>, kwargs: KeywordArgsArray) {
        const badArgsError = new Sk.builtin.TypeError(
          "MathOperations() does not accept arguments"
        );

        // Ensure no arguments are provided for instantiation
        if (args.length > 0 || kwargs.length > 0) {
          throw badArgsError;
        }

        return new mod.MathOperations(); // Return a new instance of MathOperations
      },
    },

    // Optional properties or getters/setters for the class
    getsets: {
      is_visible: ggb.sharedGetSets.is_visible,
      color: ggb.sharedGetSets.color,
      color_floats: ggb.sharedGetSets.color_floats,
    },
  });

  // Add MathOperations to the module
  mod.MathOperations = cls;

  // Register the MathOperations object type with the system
  registerObjectType("mathoperations", cls);
};