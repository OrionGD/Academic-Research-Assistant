declare module 'razorpay' {
  export default class Razorpay {
    constructor(options: { key_id: string; key_secret: string });
    orders: {
      create(options: { amount: number; currency: string; receipt: string; notes: Record<string, string> }): Promise<any>;
    };
    plans: {
      create(options: any): Promise<any>;
    };
  }
}
