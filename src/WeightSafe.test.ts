import { WeightSafe, Info } from './WeightSafe';
import { AccountUpdate, Field, MerkleTree, Mina, PrivateKey } from 'snarkyjs';

describe('WeightSafe.js', () => {
  it('Test ZK Program', async () => {
    let doProofs = true;
    type Names = 'Bob' | 'Alice';
    let Local = Mina.LocalBlockchain({ proofsEnabled: doProofs });
    Mina.setActiveInstance(Local);
    let initialBalance = 10_000_000_000;

    let feePayerKey = Local.testAccounts[0].privateKey;
    let feePayer = Local.testAccounts[0].publicKey;

    let zkappKey = PrivateKey.random();
    let zkappAddress = zkappKey.toPublicKey();

    // let Bob = new Voter(Local.testAccounts[0].publicKey);
    // let Alice = new Voter(Local.testAccounts[1].publicKey);

    let WeightSafeZkApp = new WeightSafe(zkappAddress);
    if (doProofs) {
      await WeightSafe.compile();
    }

    let tx = await Mina.transaction(feePayer, () => {
      AccountUpdate.fundNewAccount(feePayer).send({
        to: zkappAddress,
        amount: initialBalance,
      });
      WeightSafeZkApp.deploy();
    });
    await tx.prove();
    await tx.sign([feePayerKey, zkappKey]).send();

    WeightSafeZkApp.ratePerKG.assertEquals(Field(500));
    WeightSafeZkApp.threshold.assertEquals(Field(90));

    tx = await Mina.transaction(feePayer, () => {
      // call out method with final proof from the ZkProgram as argument
      WeightSafeZkApp.calculateExtraFees(
        Local.testAccounts[1].publicKey,
        Field(110)
      );
    });
    await tx.prove();
    await tx.sign([feePayerKey, zkappKey]).send();

    // get returned value of calculateExtraFees

    const event = await WeightSafeZkApp.fetchEvents();
    // console first element from array if exist
    // if (event.length > 0) {
    //   let x: Info = event[0].event.data;
    //   console.log((event[0].event.data));

    // }
  });
});
