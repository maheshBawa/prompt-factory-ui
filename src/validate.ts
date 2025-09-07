import Ajv from "ajv";
import addFormats from "ajv-formats";
import schema from "./schema.json";
import { readJson } from "./io";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

const main = () => {
  const obj = readJson("out/answers.json");
  if (validate(obj)) {
    console.log("Valid ✅");
  } else {
    console.error("Invalid ❌", validate.errors);
    process.exit(1);
  }
};
main();
