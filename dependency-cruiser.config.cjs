module.exports = {
  forbidden: [
    {
      name: "no-cycles",
      severity: "error",
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: "framework-does-not-import-servers",
      severity: "error",
      from: {
        path: "^packages/",
      },
      to: {
        path: "^servers/",
      },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
  },
};
