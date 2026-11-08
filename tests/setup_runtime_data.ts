import os from "node:os";
import path from "node:path";

process.env.MTTI_DATA_DIR = path.join(os.tmpdir(), `mukiria-trainer-dashboard-test-${process.pid}`);
