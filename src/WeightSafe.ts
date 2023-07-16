import {
  Experimental,
  Field,
  method,
  Proof,
  Provable,
  PublicKey,
  SmartContract,
  State,
  state,
  Struct,
} from 'snarkyjs';

export { WeightSafe, Info };

class Info extends Struct({
  passanger: PublicKey,
  ExtraFees: Field,
}) {
  constructor(passanger: PublicKey, ExtraFees: Field) {
    super({ passanger, ExtraFees });
  }
}

class WeightSafe extends SmartContract {
  @state(Field) ratePerKG = State<Field>();
  @state(Field) threshold = State<Field>();

  events = {
    passangerInfo: Info,
  };

  @method init() {
    super.init();
    this.ratePerKG.set(Field(500)); // in terms of Rupees (INR)
    this.threshold.set(Field(90)); // threshold weigh is 90 kgs
  }

  // overallWeight stores the weight of handbag, luggage, passanger and any extra luggage if they are carying
  @method calculateExtraFees(userPublicKey: PublicKey, overallWeight: Field) {
    let rate_per_kg = this.ratePerKG.get();
    this.ratePerKG.assertEquals(rate_per_kg);

    let _threshold = this.threshold.get();
    this.threshold.assertEquals(_threshold);

    let extraWeight: Field = Provable.if(
      overallWeight.lessThanOrEqual(_threshold),
      Field(0),
      overallWeight.sub(_threshold)
    );

    let overAllFees: Field = extraWeight.mul(rate_per_kg);

    this.emitEvent('passangerInfo', new Info(userPublicKey, overAllFees));
    return overAllFees;
  }
}
