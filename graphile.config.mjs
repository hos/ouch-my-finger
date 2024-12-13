// @ts-check
import { makePgService } from "@dataplan/pg/adaptors/pg";
import AmberPreset from "postgraphile/presets/amber";

import { sideEffect } from "postgraphile/grafast";
import { makeWrapPlansPlugin } from "postgraphile/utils";

export const UserPlugin = makeWrapPlansPlugin((build) => {
  const { users } = build.input.pgRegistry.pgResources;

  return {
    Mutation: {
      updateUserByRowId: {
        plan(plan, $source, { $input: { $rowId } }) {
          const $before = users.find({ id: $rowId }).single();

          const $valueBefore = $before.get("value1");
          // Uncomment this line and it will have both values, prev and new,
          // instead of having both values as new.
          // $valueBefore.hasSideEffects = true;

          const $plan = plan();
          const $update = $plan.get("result");
          const $valueAfter = $update.get("value1");

          sideEffect(
            [$valueBefore, $valueAfter],
            async ([valueBefore, valueAfter]) => {
              console.log(`[valueBefore, valueAfter]`, [
                valueBefore,
                valueAfter,
              ]);
            }
          );

          return $plan;
        },
      },
    },
  };
});

/** @satisfies {GraphileConfig.Preset} */
const preset = {
  extends: [
    AmberPreset.default ?? AmberPreset,
    // PostGraphileConnectionFilterPreset,
    // PgManyToManyPreset,
    // PgAggregatesPreset,
    // PgSimplifyInflectionPreset
  ],
  plugins: [
    UserPlugin,
    // PersistedPlugin.default,
    // PgOmitArchivedPlugin,
    // TagsFilePlugin,
  ],
  pgServices: [
    makePgService({
      // Database connection string:
      // connectionString: process.env.DATABASE_URL,
      // superuserConnectionString: process.env.SUPERUSER_DATABASE_URL ?? process.env.DATABASE_URL,
      // schemas: process.env.DATABASE_SCHEMAS?.split(",") ?? ["public"],
      connectionString:
        "postgresql://postgres:postgres@localhost:5432/reproducible",
      superuserConnectionString:
        process.env.SUPERUSER_DATABASE_URL ??
        "postgresql://postgres:postgres@localhost:5432/reproducible",
      schemas: process.env.DATABASE_SCHEMAS?.split(",") ?? ["public"],
      // Enable LISTEN/NOTIFY:
      pubsub: true,
    }),
  ],
  grafserv: {
    port: 5678,
    websockets: true,
    watch: true,
  },
  grafast: {
    explain: true,
  },
  schema: {
    defaultBehavior: "-connection",
  },
};

export default preset;
