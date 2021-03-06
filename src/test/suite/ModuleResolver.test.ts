import * as assert from "assert";
import * as path from "path";
import * as prettier from "prettier";
import * as sinon from "sinon";

import { getWorkspaceFolderUri } from "./format.test";
import { ModuleResolver } from "../../ModuleResolver";
import { LoggingService } from "../../LoggingService";
import { NotificationService } from "../../NotificationService";
import {
  OUTDATED_PRETTIER_INSTALLED,
  USING_BUNDLED_PRETTIER,
} from "../../message";

suite("Test ModuleResolver", function () {
  let moduleResolver: ModuleResolver;
  let logErrorSpy: sinon.SinonSpy;
  let logInfoSpy: sinon.SinonSpy;

  this.beforeEach(() => {
    const loggingService = new LoggingService();
    logErrorSpy = sinon.spy(loggingService, "logError");
    logInfoSpy = sinon.spy(loggingService, "logInfo");
    const notificationService = new NotificationService(loggingService);

    moduleResolver = new ModuleResolver(loggingService, notificationService);
  });

  suite("getPrettierInstance", () => {
    test("it returns the bundled version of Prettier if local isn't found", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("no-dep").fsPath,
        "index.js"
      );
      const prettierInstance = await moduleResolver.getPrettierInstance(
        fileName,
        {
          showNotifications: true,
        }
      );

      assert.strictEqual(prettierInstance, prettier);
      assert(logInfoSpy.calledWith(USING_BUNDLED_PRETTIER));
    });

    test("it returns the bundled version of Prettier if local is outdated", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("outdated").fsPath,
        "ugly.js"
      );
      const prettierInstance = await moduleResolver.getPrettierInstance(
        fileName
      );

      assert.strictEqual(prettierInstance, undefined);
      assert(logErrorSpy.calledWith(OUTDATED_PRETTIER_INSTALLED));
    });

    test("it returns prettier version from package.json", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("specific-version").fsPath,
        "ugly.js"
      );
      const prettierInstance = await moduleResolver.getPrettierInstance(
        fileName
      );

      if (!prettierInstance) {
        assert.fail("Prettier is undefined.");
      }
      assert.notStrictEqual(prettierInstance, prettier);
      assert.strictEqual(prettierInstance.version, "2.0.2");
    });

    test("it returns prettier version from module dep", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("module").fsPath,
        "index.js"
      );
      const prettierInstance = await moduleResolver.getPrettierInstance(
        fileName
      );

      if (!prettierInstance) {
        assert.fail("Prettier is undefined.");
      }
      assert.notStrictEqual(prettierInstance, prettier);
      assert.strictEqual(prettierInstance.version, "2.0.2");
    });

    test("it uses explicit dep if found instead fo a closer implicit module dep", async () => {
      const fileName = path.join(
        getWorkspaceFolderUri("explicit-dep").fsPath,
        "implicit-dep",
        "index.js"
      );
      const prettierInstance = await moduleResolver.getPrettierInstance(
        fileName
      );
      if (!prettierInstance) {
        assert.fail("Prettier is undefined.");
      }
      assert.notStrictEqual(prettierInstance, prettier);
      assert.strictEqual(prettierInstance.version, "2.0.2");
    });
  });
});
