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

    it("Calls addTransfer on a transfer add event", async () => {
      const addTransferStub = sandbox.stub(TransferController, "addTransfer");
      const removeTransferStub = sandbox.stub(
        TransferController,
        "removeTransfer"
      );

      const fakeLog = ({ removed: false } as unknown) as Log;
      const fakeDecodedLog = {
        from: "from",
        to: "to",
        value: "1",
      };
      await TransferController.processData(fake(), fakeLog, fakeDecodedLog);
      expect(addTransferStub.callCount).to.equal(1);
      expect(removeTransferStub.callCount).to.equal(0);
    });

    it("Calls removeTransfer on a transfer remove event", async () => {
      const addTransferStub = sandbox.stub(TransferController, "addTransfer");
      const removeTransferStub = sandbox.stub(
        TransferController,
        "removeTransfer"
      );

      const fakeLog = ({ removed: true } as unknown) as Log;
      const fakeDecodedLog = {
        from: "from",
        to: "to",
        value: "1",
      };
      await TransferController.processData(fake(), fakeLog, fakeDecodedLog);
      expect(addTransferStub.callCount).to.equal(0);
      expect(removeTransferStub.callCount).to.equal(1);
    });
  });

  describe("addTransfer", () => {
    const fake = sinon.fake();
    const sandbox = sinon.createSandbox();

    afterEach(() => {
      sandbox.restore();
    });

    it("Adds a new transfer event to the database", async () => {
      // TODO Initialize an empty test database

      // TODO Define dummy data that should be added to the tables by addTransfer

      // TODO Call addTransfer

      // TODO Query the database to check whether the necessary rows were added
      throw Error("Not Implemented");
    });

    it("Does not alter the balance if the transfer event already existed", async () => {
      // TODO Initialize a test database with an existing transfer event

      // TODO Define dummy data that corresponds to this existing event

      // TODO Call addTransfer

      // TODO Query the database to ensure that no balances were changed, as the
      //  transaction would have been rolled back.
      throw Error("Not Implemented");
    });
  });

  describe("removeTransfer", () => {
    const fake = sinon.fake();
    const sandbox = sinon.createSandbox();

    afterEach(() => {
      sandbox.restore();
    });

    it("Removes a transfer event from the database", async () => {
      // TODO Initialize a test database with a transaction and corresponding balances

      // TODO Define a dummy transfer that is to be removed due to ReOrg

      // TODO Call removeTransfer

      // TODO Query the database to check whether the corresponding transfer is
      //  removed and the balances updated.
      throw Error("Not Implemented");
    });

    it("Does not alter the balance if the transfer event did not exist", async () => {
      // TODO Initialize a test database without our transaction, but with corresponding balances

      // TODO Define dummy data that corresponds to this existing event

      // TODO Call removeTransfer

      // TODO Query the database to ensure that no balances were changed, as the
      //  transaction would have been rolled back.
      throw Error("Not Implemented");
    });
  });
});
