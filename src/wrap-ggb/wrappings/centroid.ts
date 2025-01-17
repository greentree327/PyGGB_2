import { AppApi } from "../../shared/appApi";
import {
  augmentedGgbApi,
  throwIfNotNumber,
  withPropertiesFromNameValuePairs,
  SkGgbObject,
  WrapExistingCtorSpec,
  throwIfLabelNull,
  SpecConstructible,
  setGgbLabelFromArgs,
  setGgbLabelFromCmd,
  assembledCommand
} from "../shared";
import { SkObject, SkulptApi } from "../../shared/vendor-types/skulptapi";

import { registerObjectType } from "../type-registry";

declare var Sk: SkulptApi;

interface SkGgbCentroid extends SkGgbObject {
  polygon: SkGgbObject;
}

type SkGgbCentroidCtorSpec =
  | WrapExistingCtorSpec
  | {
      kind: "polygon";
      polygon: SkGgbObject;
    }
  ;

export const register = (
  mod: { Centroid: SpecConstructible<SkGgbCentroidCtorSpec, SkGgbCentroid> },
  appApi: AppApi
) => {
  const ggb = augmentedGgbApi(appApi.ggb);
  const skApi = appApi.sk;

  const cls = Sk.abstr.buildNativeClass("Centroid", {
    constructor: function Centroid(this: SkGgbCentroid, spec: SkGgbCentroidCtorSpec) {
      // const setLabelCmd = setGgbLabelFromCmd(ggb, this);

      switch (spec.kind) {
        case "wrap-existing": {
          this.$ggbLabel = spec.label;
          break;
        }
        case "polygon": {
          const ggbCmd = assembledCommand("Centroid", [
                spec.polygon.$ggbLabel,
              ]);
              const lbls = ggb.evalCmd(ggbCmd);
              this.$ggbLabel = lbls.split(",")[0];
              // Retrieve the x- and y-coordinates of the centroid
              const xCoord = ggb.getXcoord(this.$ggbLabel);
              const yCoord = ggb.getYcoord(this.$ggbLabel);

              // Return the coordinates as a formatted string
              return new Sk.builtin.str(`(${xCoord}, ${yCoord})`);

        }
        default:
          throw new Sk.builtin.TypeError(
            `bad Centroid spec kind "${(spec as any).kind}"`
          );
      }

      this.$updateHandlers = [];
      ggb.registerObjectUpdateListener(this.$ggbLabel, () =>
        this.$fireUpdateEvents()
      );
    },
    slots: {
      tp$new(args, kwargs) {
        const badArgsError = new Sk.builtin.TypeError(
          "Centroid() arguments must be (Polygon)"
        );

        const make = (spec: SkGgbCentroidCtorSpec) =>
          withPropertiesFromNameValuePairs(new mod.Centroid(spec), kwargs);

        switch (args.length) {
          case 1: {
            if (ggb.isGgbObject(args[0])
              && args[0].tp$name == "Polygon") {
              return make({ kind: "polygon", polygon: args[0] });
            }

            throw badArgsError;
          }
          
          default:
            throw badArgsError;
        }
      },
      ...ggb.sharedOpSlots,
    },
    methods: {
      when_moved: {
        $meth(this: SkGgbCentroid, pyFun: any) {
          this.$updateHandlers.push(pyFun);
          return pyFun;
        },
        $flags: { OneArg: true },
      },
      ...ggb.withPropertiesMethodsSlice,
      ...ggb.freeCopyMethodsSlice,
      ...ggb.deleteMethodsSlice,
    },
    getsets: {
      is_visible: ggb.sharedGetSets.is_visible,
      with_label: ggb.sharedGetSets.label_visible,
      is_independent: ggb.sharedGetSets.is_independent,
      color: ggb.sharedGetSets.color,
      color_floats: ggb.sharedGetSets.color_floats,
      size: ggb.sharedGetSets.size,
      _ggb_type: ggb.sharedGetSets._ggb_type,
    },
  });

  mod.Centroid = cls;
  registerObjectType("centroid", cls);
};
