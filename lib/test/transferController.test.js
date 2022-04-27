"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const sinon = __importStar(require("sinon"));
const transferController_1 = require("../src/transferController");
(0, mocha_1.describe)("TransferController", () => {
    (0, mocha_1.describe)("processData", () => {
        const fake = sinon.fake();
        const sandbox = sinon.createSandbox();
        (0, mocha_1.afterEach)(() => {
            sandbox.restore();
        });
        (0, mocha_1.it)("Calls addTransfer on a transfer add event", () => __awaiter(void 0, void 0, void 0, function* () {
            const addTransferStub = sandbox.stub(transferController_1.TransferController, "addTransfer");
            const removeTransferStub = sandbox.stub(transferController_1.TransferController, "removeTransfer");
            const fakeLog = { removed: false };
            const fakeDecodedLog = {
                from: "from",
                to: "to",
                value: "1",
            };
            yield transferController_1.TransferController.processData(fake(), fakeLog, fakeDecodedLog);
            (0, chai_1.expect)(addTransferStub.callCount).to.equal(1);
            (0, chai_1.expect)(removeTransferStub.callCount).to.equal(0);
        }));
        (0, mocha_1.it)("Calls removeTransfer on a transfer remove event", () => __awaiter(void 0, void 0, void 0, function* () {
            const addTransferStub = sandbox.stub(transferController_1.TransferController, "addTransfer");
            const removeTransferStub = sandbox.stub(transferController_1.TransferController, "removeTransfer");
            const fakeLog = { removed: true };
            const fakeDecodedLog = {
                from: "from",
                to: "to",
                value: "1",
            };
            yield transferController_1.TransferController.processData(fake(), fakeLog, fakeDecodedLog);
            (0, chai_1.expect)(addTransferStub.callCount).to.equal(0);
            (0, chai_1.expect)(removeTransferStub.callCount).to.equal(1);
        }));
    });
    (0, mocha_1.describe)("addTransfer", () => {
        const fake = sinon.fake();
        const sandbox = sinon.createSandbox();
        (0, mocha_1.afterEach)(() => {
            sandbox.restore();
        });
        (0, mocha_1.it)("Adds a new transfer event to the database", () => __awaiter(void 0, void 0, void 0, function* () {
            // TODO Initialize an empty test database
            // TODO Define dummy data that should be added to the tables by addTransfer
            // TODO Call addTransfer
            // TODO Query the database to check whether the necessary rows were added
            throw Error("Not Implemented");
        }));
        (0, mocha_1.it)("Does not alter the balance if the transfer event already existed", () => __awaiter(void 0, void 0, void 0, function* () {
            // TODO Initialize a test database with an existing transfer event
            // TODO Define dummy data that corresponds to this existing event
            // TODO Call addTransfer
            // TODO Query the database to ensure that no balances were changed, as the
            //  transaction would have been rolled back.
            throw Error("Not Implemented");
        }));
    });
    (0, mocha_1.describe)("removeTransfer", () => {
        const fake = sinon.fake();
        const sandbox = sinon.createSandbox();
        (0, mocha_1.afterEach)(() => {
            sandbox.restore();
        });
        (0, mocha_1.it)("Removes a transfer event from the database", () => __awaiter(void 0, void 0, void 0, function* () {
            // TODO Initialize a test database with a transaction and corresponding balances
            // TODO Define a dummy transfer that is to be removed due to ReOrg
            // TODO Call removeTransfer
            // TODO Query the database to check whether the corresponding transfer is
            //  removed and the balances updated.
            throw Error("Not Implemented");
        }));
        (0, mocha_1.it)("Does not alter the balance if the transfer event did not exist", () => __awaiter(void 0, void 0, void 0, function* () {
            // TODO Initialize a test database without our transaction, but with corresponding balances
            // TODO Define dummy data that corresponds to this existing event
            // TODO Call removeTransfer
            // TODO Query the database to ensure that no balances were changed, as the
            //  transaction would have been rolled back.
            throw Error("Not Implemented");
        }));
    });
});
