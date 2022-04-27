import { expect } from "chai";
import { afterEach, describe, it } from "mocha";
import * as sinon from "sinon";
import { TransferController } from "../src/transferController";
import { Log } from "web3-core";

describe("TransferController", () => {

  describe("processData", () => {
    const fake = sinon.fake();
    const sandbox = sinon.createSandbox();


    afterEach(() => {
      sandbox.restore();
    });
    it("Calls removeTransfer on a transfer remove event", async () => {
      // const addTransferSpy = sandbox.spy(TransferController, "addTransfer");
      // const removeTransferSpy = sandbox.spy(
      //   TransferController,
      //   "removeTransfer"
      // );

      const addTransferSpy = sinon.stub(TransferController, "addTransfer");
      const removeTransferSpy = sinon.stub(TransferController, "removeTransfer");


      const fakeLog = ({ removed: true } as unknown) as Log;
      const fakeDecodedLog = {
        from: "from",
        to: "to",
        value: "1"
      };
      await TransferController.processData(fake(), fakeLog, fakeDecodedLog);
      expect(addTransferSpy.callCount).to.equal(0);
      expect(removeTransferSpy.callCount).to.equal(1);
    });
  });

  describe("addTransfer", () => {
    const fake = sinon.fake();
    const sandbox = sinon.createSandbox();


    afterEach(() => {
      sandbox.restore();
    });
    it("Adds a new transfer event to the database", async () => {
      // const addTransferSpy = sandbox.spy(TransferController, "addTransfer");
      // const removeTransferSpy = sandbox.spy(
      //   TransferController,
      //   "removeTransfer"
      // );

      const addTransferSpy = sinon.stub(TransferController, "addTransfer");
      const removeTransferSpy = sinon.stub(TransferController, "removeTransfer");


      const fakeLog = ({ removed: true } as unknown) as Log;
      const fakeDecodedLog = {
        from: "from",
        to: "to",
        value: "1"
      };
      await TransferController.processData(fake(), fakeLog, fakeDecodedLog);
      expect(addTransferSpy.callCount).to.equal(0);
      expect(removeTransferSpy.callCount).to.equal(1);
    });

    it("Does not alter the balance if the transfer event already existed", async () => {
    });
  });

});
