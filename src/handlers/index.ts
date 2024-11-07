import fs from "fs";
import path from "path";

const handlersPath = path.resolve(__dirname);

fs.readdirSync(handlersPath).forEach((file) => {
  if (file !== "index.ts" && file.endsWith(".ts")) {
    import(path.join(handlersPath, file)).then((module) => {
      if (typeof module.default === "function") {
        module.default();
      }
    });
  }
});
