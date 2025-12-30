const requiredBasePath = "/mind-garden-js/";
const configuredBasePath = process.env.VITE_BASE_PATH ?? requiredBasePath;

if (configuredBasePath !== requiredBasePath) {
  console.error(
    `Invalid VITE_BASE_PATH: expected "${requiredBasePath}", got "${configuredBasePath}". ` +
      "Update VITE_BASE_PATH to match before running the build."
  );
  process.exit(1);
}
