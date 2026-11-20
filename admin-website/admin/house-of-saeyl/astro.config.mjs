import node from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";

export default defineConfig({
  output: "server",

  adapter: node({
    mode: "standalone",
  }),

  image: {
    layout: "constrained",
    responsiveStyles: true,
  },

  integrations: [
    react(),

    emdash({
      database: sqlite({ url: "file:./data.db" }),

      storage: local({
        directory: "./uploads",
        baseUrl: "/_emdash/api/media/file",
      }),
    }),
  ],

  security: {
  allowedDomains: [
    {
      protocol: "http",
      hostname: "127.0.0.1",
      port: "5501",
    },
    {
      protocol: "http",
      hostname: "localhost",
      port: "5501",
    },
    {
      protocol: "http",
      hostname: "127.0.0.1",
      port: "5500",
    },
    {
      protocol: "http",
      hostname: "localhost",
      port: "5500",
    },
  ],
},

  devToolbar: {
    enabled: false,
  },
});