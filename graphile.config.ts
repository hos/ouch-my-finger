import "graphile-config";

import { makePgService } from "@dataplan/pg/adaptors/pg";
import AmberPreset from "postgraphile/presets/amber";
import { makeV4Preset } from "postgraphile/presets/v4";
import {
  makeAddPgTableOrderByPlugin,
  makePgSmartTagsFromFilePlugin,
  orderByAscDesc,
} from "postgraphile/utils";
import { PostGraphileConnectionFilterPreset } from "postgraphile-plugin-connection-filter";
import { PgAggregatesPreset } from "@graphile/pg-aggregates";
import { PgManyToManyPreset } from "@graphile-contrib/pg-many-to-many";
// import { PgSimplifyInflectionPreset } from "@graphile/simplify-inflection";
import PersistedPlugin from "@grafserv/persisted";
import { PgOmitArchivedPlugin } from "@graphile-contrib/pg-omit-archived";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { sqlValueWithCodec, TYPES } from "postgraphile/@dataplan/pg";
import { context } from "postgraphile/grafast";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// For configuration file details, see: https://postgraphile.org/postgraphile/next/config

const TagsFilePlugin = makePgSmartTagsFromFilePlugin(`${__dirname}/tags.json5`);

declare global {
  namespace Grafast {
    interface Context {
      locale: string;
    }

    interface RequestContext {
      connectionParams?: any;
      jwtClaims: Record<string, any>;
    }
  }
}

export const UsersOrderByPlugin = makeAddPgTableOrderByPlugin(
  { schemaName: "public", tableName: "users" },
  (build) => {
    const { sql } = build;
    const sqlIdentifier = sql.identifier(Symbol("translation"));

    const customOrderBy = orderByAscDesc(
      "NAME",
      ($select) => {
        const $locale = context().get("locale");
        const orderByFrag = sql`(
          select coalesce(
            (
              select ${sqlIdentifier}.value
              from public.translations as ${sqlIdentifier}
              where ${sqlIdentifier}.key = ${$select.alias}.name
                and ${sqlIdentifier}.language = ${sqlValueWithCodec($locale, TYPES.text)}
            ),
            ${$select.alias}.name
          )`;

        return { fragment: orderByFrag, codec: TYPES.text };
      },
      { nulls: "last" }
    );

    return customOrderBy;
  }
);

const preset: GraphileConfig.Preset = {
  extends: [
    AmberPreset.default ?? AmberPreset,
    makeV4Preset({
      /* Enter your V4 options here */
      graphiql: true,
      graphiqlRoute: "/",
    }),
    PostGraphileConnectionFilterPreset,
    PgManyToManyPreset,
    PgAggregatesPreset,
    // PgSimplifyInflectionPreset
  ],
  plugins: [PersistedPlugin.default, PgOmitArchivedPlugin, TagsFilePlugin, UsersOrderByPlugin],
  pgServices: [
    makePgService({
      // Database connection string:
      connectionString: process.env.DATABASE_URL,
      superuserConnectionString:
        process.env.SUPERUSER_DATABASE_URL ?? process.env.DATABASE_URL,
      // List of schemas to expose:
      schemas: process.env.DATABASE_SCHEMAS?.split(",") ?? ["public"],
      // Enable LISTEN/NOTIFY:
      pubsub: true,
    }),
  ],
  grafserv: {
    port: 5678,
    websockets: true,
    allowUnpersistedOperation: true,
    watch: true,
  },
  grafast: {
    explain: true,
    context: ({ expressv4 }, ctx) => {
      const locale =
        expressv4?.req.headers["accept-language"]?.split(",")[0] || "en";

      return {
        locale,
        ...ctx,
      };
    },
  },
};

export default preset;
